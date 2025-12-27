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
}

let cachedVersion: { version: [number, number, number], isLatest: boolean } | null = null;
const getWaVersion = async () => {
    if (cachedVersion) return cachedVersion;
    try {
        const { version, isLatest } = await fetchLatestBaileysVersion();
        cachedVersion = { version, isLatest };
        return cachedVersion;
    } catch (e) {
        // Fallback to a recent known version if fetch fails
        return { version: [2, 3000, 1015901307] as [number, number, number], isLatest: false };
    }
};

const sessions = new Map<string, SessionData>();

export const waManager = {
    getSession: (id: string) => sessions.get(id),

    startSession: async (id: string) => {
        if (sessions.has(id)) {
            const s = sessions.get(id)!;
            if (s.status === 'connected') return s;
        }

        const { state, saveCreds } = await useSQLiteAuthState(id);
        const { version, isLatest } = await getWaVersion();
        console.log(`[WA:${id}] Using WA version v${version.join('.')}, isLatest: ${isLatest}`);

        // Custom Log Stream with Buffering
        let lineBuffer = '';
        const logStream = new Writable({
            write(chunk, encoding, callback) {
                const str = chunk.toString();
                process.stdout.write(str); // Keep console output

                lineBuffer += str;
                const lines = lineBuffer.split('\n');

                // The last element is either empty (if str ended with \n) or a partial line
                lineBuffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const logObj = JSON.parse(line);
                        logBus.publish(id, logObj);
                    } catch (e) {
                        // Ignore non-JSON lines (e.g. standard console logs mixed in)
                    }
                }
                callback();
            }
        });

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'debug' }, logStream) as any,
            browser: ['XiW Bot', 'Chrome', '125.0.0.0'], // Proper identification
            connectTimeoutMs: 60_000,
            defaultQueryTimeoutMs: 60_000,
            keepAliveIntervalMs: 10_000,
            emitOwnEvents: false,
            retryRequestDelayMs: 250,
            syncFullHistory: false,
            markOnlineOnConnect: false,
            generateHighQualityLinkPreview: true
        });

        const sessionData: SessionData = {
            socket: sock,
            qr: null,
            status: 'connecting'
        };
        sessions.set(id, sessionData);

        sock.ev.on('creds.update', saveCreds);

        // [MPE] Track Inbound for 24h Window
        sock.ev.on('messages.upsert', (m) => {
            if (m.type !== 'notify') return;
            for (const msg of m.messages) {
                if (!msg.key.fromMe && msg.key.remoteJid && !msg.key.remoteJid.includes('@g.us')) {
                    const phone = waManager.formatJid(msg.key.remoteJid).replace('@s.whatsapp.net', '').replace(/\D/g, '');
                    try {
                        // Upsert Contact to start window
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
            sessionData.lastConnectionUpdate = update;

            if (qr) {
                sessionData.qr = qr;
                sessionData.status = 'connecting';
                console.log(`[WA:${id}] QR Code generated`);
            }

            if (connection === 'close') {
                const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;

                // Determine Reason
                let stopReason = 'unknown';
                if (statusCode === DisconnectReason.loggedOut || statusCode === 401) stopReason = 'auth_expired';
                else if (statusCode === DisconnectReason.connectionClosed) stopReason = 'network';
                else stopReason = 'crash';

                const errorMsg = String(lastDisconnect?.error || 'Unknown Error');
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== 401;

                console.log(`[WA:${id}] Connection closed. Status: ${statusCode}, Reason: ${stopReason}, Error: ${errorMsg}, Reconnecting: ${shouldReconnect}`);

                sessionData.status = 'disconnected';
                sessionData.qr = null;
                sessionData.user = undefined;

                // [P1] Persist Failure Context (Transient)
                db.query('UPDATE instances SET last_known_error = $err, last_stop_reason = $reason WHERE id = $id').run({
                    $err: errorMsg,
                    $reason: shouldReconnect ? 'reconnecting' : stopReason, // If reconnecting, maybe not a "stop" reason, but useful context
                    $id: id
                });

                if (shouldReconnect) {
                    setTimeout(() => {
                        waManager.startSession(id).catch(e => console.error(`[WA:${id}] Reconnect failed:`, e));
                    }, 3000);
                } else {
                    console.log(`[WA:${id}] Session expired or logged out. Cleaning up...`);
                    sessions.delete(id);
                    db.query('DELETE FROM whatsapp_sessions WHERE id = $id').run({ $id: id });

                    // Final Stop State
                    db.query('UPDATE instances SET status = $status, last_stop_reason = $reason, last_known_error = $err WHERE id = $id').run({
                        $status: 'stopped',
                        $reason: stopReason,
                        $err: errorMsg,
                        $id: id
                    });
                }
            } else if (connection === 'open') {
                console.log(`[WA:${id}] Connected`);
                sessionData.status = 'connected';
                sessionData.qr = null;
                // Clear errors on success
                db.query('UPDATE instances SET status = $status, last_known_error = NULL, last_stop_reason = NULL WHERE id = $id').run({
                    $status: 'running',
                    $id: id
                });

                // Capture user info
                sessionData.user = {
                    id: sock.user?.id || '',
                    name: sock.user?.name || sock.user?.notify || undefined
                };
            }
        });

        return sessionData;
    },

    deleteSession: async (id: string) => {
        const session = sessions.get(id);
        if (session?.socket) {
            session.socket.end(undefined);
        }
        sessions.delete(id);
        // Clean DB? Maybe keep data but mark stopped?
        db.query('DELETE FROM whatsapp_sessions WHERE id = $id').run({ $id: id });
        db.query('UPDATE instances SET status = "stopped", last_stop_reason = "manual", last_known_error = NULL WHERE id = $id').run({ $id: id });
    },
    formatJid: (number: string) => {
        if (!number) return '';
        if (number.includes('@s.whatsapp.net') || number.includes('@g.us')) return number;
        // Strip non-numeric chars
        const sanitized = number.replace(/\D/g, '');
        return `${sanitized}@s.whatsapp.net`;
    }
};
