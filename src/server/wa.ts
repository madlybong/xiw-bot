import _makeWASocket, { fetchLatestBaileysVersion, DisconnectReason, useMultiFileAuthState, type ConnectionState } from '@whiskeysockets/baileys';
// Fix for Bun/ESBuild interop where default export is wrapped
const makeWASocket = (_makeWASocket as any).default || _makeWASocket;
import { useSQLiteAuthState } from './wa-auth';
import db from './db';
import { pino } from 'pino';
import { logBus } from './log-bus';
import { Writable } from 'stream';

// In-memory store for active sessions
interface SessionData {
    socket: ReturnType<typeof makeWASocket> | null;
    qr: string | null;
    status: 'connecting' | 'connected' | 'disconnected';
    lastConnectionUpdate?: Partial<ConnectionState>;
    user?: { name?: string; id: string };
    retryCount: number; // [Phase 2]
    reconnectTimer?: ReturnType<typeof setTimeout>;
    firstQrTime?: number; // [Phase 4]
}

let cachedVersion: { version: [number, number, number], isLatest: boolean } | null = null;
const getWaVersion = async () => {
    if (cachedVersion) return cachedVersion;
    try {
        const { version, isLatest } = await fetchLatestBaileysVersion();
        cachedVersion = { version, isLatest };
        return cachedVersion;
    } catch (e) {
        return { version: [2, 3000, 1015901307] as [number, number, number], isLatest: false };
    }
};

const sessions = new Map<string, SessionData>();

export const waManager = {
    getSession: (id: string) => sessions.get(id),

    stopAll: async () => {
        for (const id of sessions.keys()) {
            await waManager.deleteSession(id);
        }
    },

    startSession: async (id: string, retryCount = 0) => {
        // If already connected, return
        if (sessions.has(id)) {
            const s = sessions.get(id)!;
            if (s.status === 'connected') return s;
            // If connecting, maybe let it be?
            // But if we are retrying, we might need to overwrite.
        }

        const { state, saveCreds } = await useSQLiteAuthState(id);
        const { version, isLatest } = await getWaVersion();
        console.log(`[WA:${id}] Using WA version v${version.join('.')}, isLatest: ${isLatest}`);

        // Custom Log Stream with Buffering
        let lineBuffer = '';
        const logStream = new Writable({
            write(chunk, encoding, callback) {
                const str = chunk.toString();
                process.stdout.write(str);

                lineBuffer += str;
                const lines = lineBuffer.split('\n');
                lineBuffer = lines.pop() || '';
                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const logObj = JSON.parse(line);
                        logBus.publish(id, logObj);
                    } catch (e) { }
                }
                callback();
            }
        });

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'debug' }, logStream) as any,
            browser: ['Ubuntu', 'Chrome', '125.0.0.0'], // [Phase 3] Standardized Fingerprint
            connectTimeoutMs: 60_000,
            defaultQueryTimeoutMs: 60_000,
            keepAliveIntervalMs: 10_000,
            emitOwnEvents: false,
            retryRequestDelayMs: 250,
            syncFullHistory: false,
            markOnlineOnConnect: false,
            generateHighQualityLinkPreview: true
        });

        // Preserve retry count if passing from recursive call, or init
        const sessionData: SessionData = {
            socket: sock,
            qr: null,
            status: 'connecting',
            retryCount: retryCount,
            firstQrTime: undefined
        };
        sessions.set(id, sessionData);

        sock.ev.on('creds.update', saveCreds);

        // [MPE] Track Inbound for 24h Window
        sock.ev.on('messages.upsert', (m: any) => {
            if (m.type !== 'notify') return;
            for (const msg of m.messages) {
                if (!msg.key.fromMe && msg.key.remoteJid && !msg.key.remoteJid.includes('@g.us')) {
                    const phone = waManager.formatJid(msg.key.remoteJid).replace('@s.whatsapp.net', '').replace(/\D/g, '');
                    try {
                        db.query(`
                            INSERT INTO contacts (phone, name, source, last_inbound_at)
                            VALUES ($p, $p, 'auto', CURRENT_TIMESTAMP)
                            ON CONFLICT(phone) DO UPDATE SET last_inbound_at = CURRENT_TIMESTAMP
                        `).run({ $p: phone });
                    } catch (e) { console.error('Failed to update inbound time', e); }
                }
            }
        });

        sock.ev.on('connection.update', (update: Partial<ConnectionState>) => {
            const { connection, lastDisconnect, qr } = update;

            // Get current session ref (it might have been updated/replaced?)
            const currentSession = sessions.get(id);
            if (currentSession) currentSession.lastConnectionUpdate = update;

            if (qr) {
                if (currentSession) {
                    currentSession.qr = qr;
                    currentSession.status = 'connecting';

                    // [Phase 4] QR Timeout Logic
                    if (!currentSession.firstQrTime) currentSession.firstQrTime = Date.now();
                    const elapsed = (Date.now() - currentSession.firstQrTime) / 1000;
                    if (elapsed > 300) { // 5 minutes max
                        console.log(`[WA:${id}] QR Code Timeout (5 mins). Stopping session.`);
                        waManager.deleteSession(id);
                        db.query('UPDATE instances SET status = "stopped", last_stop_reason = "qr_timeout" WHERE id = $id').run({ $id: id });
                        return;
                    }
                }
                console.log(`[WA:${id}] QR Code generated`);
            }

            if (connection === 'close') {
                const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;

                // Determine Reason & Strategy
                let stopReason = 'unknown';
                let shouldReconnect = true;
                let delay = 3000;

                // [Phase 2] Resilience Logic
                if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                    stopReason = 'auth_expired';
                    shouldReconnect = false;
                } else if (statusCode === 428) {
                    stopReason = 'precondition_blocked';
                    shouldReconnect = false; // Usually fatal, requires reset
                } else if (statusCode === 515) {
                    // Stream error, immediate retry
                    delay = 0;
                } else if (statusCode === DisconnectReason.connectionClosed) {
                    stopReason = 'network';
                } else {
                    stopReason = 'crash';
                }

                const errorMsg = String(lastDisconnect?.error || 'Unknown Error');

                console.log(`[WA:${id}] Closed. Code: ${statusCode}, Reason: ${stopReason}, Retry: ${currentSession?.retryCount || 0}`);

                if (currentSession) {
                    currentSession.status = 'disconnected';
                    currentSession.qr = null;
                    currentSession.user = undefined;
                    currentSession.firstQrTime = undefined; // Reset
                }

                db.query('UPDATE instances SET last_known_error = $err, last_stop_reason = $reason WHERE id = $id').run({
                    $err: errorMsg,
                    $reason: shouldReconnect ? 'reconnecting' : stopReason,
                    $id: id
                });

                if (shouldReconnect) {
                    const nextRetry = (currentSession?.retryCount || 0) + 1;
                    // Exponential Backoff: 2s, 4s, 8s, 16s... max 60s
                    // 515 might force 0 delay, but we'll respect backoff if it keeps happening
                    delay = delay === 0 ? 0 : Math.min(60000, Math.pow(2, nextRetry) * 2000); // Start at 4s

                    console.log(`[WA:${id}] Reconnecting in ${delay}ms... (Attempt ${nextRetry})`);

                    const timer = setTimeout(() => {
                        waManager.startSession(id, nextRetry).catch(e => console.error(`[WA:${id}] Reconnect failed:`, e));
                    }, delay);

                    if (currentSession) currentSession.reconnectTimer = timer;

                } else {
                    console.log(`[WA:${id}] Fatal disconnect. Cleaning up.`);
                    sessions.delete(id);

                    // Cleanup Auth (Legacy + New)
                    db.query('DELETE FROM whatsapp_sessions WHERE id = $id').run({ $id: id });
                    db.query('DELETE FROM wa_auth_creds WHERE instance_id = $id').run({ $id: id });
                    db.query('DELETE FROM wa_auth_keys WHERE instance_id = $id').run({ $id: id });

                    db.query('UPDATE instances SET status = $status, last_stop_reason = $reason, last_known_error = $err WHERE id = $id').run({
                        $status: 'stopped',
                        $reason: stopReason,
                        $err: errorMsg,
                        $id: id
                    });
                }
            } else if (connection === 'open') {
                console.log(`[WA:${id}] Connected`);
                if (currentSession) {
                    currentSession.status = 'connected';
                    currentSession.qr = null;
                    currentSession.retryCount = 0; // Reset on success
                    currentSession.firstQrTime = undefined;
                    currentSession.user = {
                        id: sock.user?.id || '',
                        name: sock.user?.name || sock.user?.notify || undefined
                    };
                }

                db.query('UPDATE instances SET status = $status, last_known_error = NULL, last_stop_reason = NULL WHERE id = $id').run({
                    $status: 'running',
                    $id: id
                });
            }
        });

        return sessionData;
    },

    deleteSession: async (id: string) => {
        const session = sessions.get(id);
        if (session) {
            if (session.reconnectTimer) clearTimeout(session.reconnectTimer);
            if (session.socket) session.socket.end(undefined);
            sessions.delete(id);
        }

        // Full Cleanup
        db.query('DELETE FROM whatsapp_sessions WHERE id = $id').run({ $id: id });
        db.query('DELETE FROM wa_auth_creds WHERE instance_id = $id').run({ $id: id });
        db.query('DELETE FROM wa_auth_keys WHERE instance_id = $id').run({ $id: id });

        db.query('UPDATE instances SET status = "stopped", last_stop_reason = "manual", last_known_error = NULL WHERE id = $id').run({ $id: id });
    },
    formatJid: (number: string) => {
        if (!number) return '';
        if (number.includes('@s.whatsapp.net') || number.includes('@g.us')) return number;
        const sanitized = number.replace(/\D/g, '');
        return `${sanitized}@s.whatsapp.net`;
    }
};


