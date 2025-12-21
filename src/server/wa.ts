import _makeWASocket, { fetchLatestBaileysVersion, DisconnectReason, useMultiFileAuthState, type ConnectionState } from '@whiskeysockets/baileys';
// Fix for Bun/ESBuild interop where default export is wrapped
const makeWASocket = (_makeWASocket as any).default || _makeWASocket;
import { useSQLiteAuthState } from './wa-auth';
import db from './db';
import { pino } from 'pino';

// In-memory store for active sessions
interface SessionData {
    socket: ReturnType<typeof makeWASocket> | null;
    qr: string | null;
    status: 'connecting' | 'connected' | 'disconnected';
    lastConnectionUpdate?: ConnectionState;
    user?: { name?: string; id: string };
}

const sessions = new Map<string, SessionData>();

export const waManager = {
    getSession: (id: string) => sessions.get(id),

    startSession: async (id: string) => {
        if (sessions.has(id)) {
            const s = sessions.get(id)!;
            if (s.status === 'connected') return s;
        }

        const { state, saveCreds } = await useSQLiteAuthState(id);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`[WA:${id}] Using WA version v${version.join('.')}, isLatest: ${isLatest}`);

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'debug' }) as any,
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

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            sessionData.lastConnectionUpdate = update;

            if (qr) {
                sessionData.qr = qr;
                sessionData.status = 'connecting';
                console.log(`[WA:${id}] QR Code generated`);
            }

            if (connection === 'close') {
                const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== 401; // 401 often means session invalid

                console.log(`[WA:${id}] Connection closed. Status: ${statusCode}, Error: ${lastDisconnect?.error}, Reconnecting: ${shouldReconnect}`);

                sessionData.status = 'disconnected';
                sessionData.qr = null;
                sessionData.user = undefined;

                if (shouldReconnect) {
                    // Add a delay to prevent tight loops
                    setTimeout(() => {
                        waManager.startSession(id).catch(e => console.error(`[WA:${id}] Reconnect failed:`, e));
                    }, 3000); // 3s delay
                } else {
                    // Documented logout or invalid session
                    console.log(`[WA:${id}] Session expired or logged out. Cleaning up...`);
                    sessions.delete(id);
                    // CRITICAL: Delete the stale session data so next start generates a new QR
                    db.query('DELETE FROM whatsapp_sessions WHERE id = $id').run({ $id: id });
                    db.query('UPDATE instances SET status = $status WHERE id = $id').run({ $status: 'disconnected', $id: id });
                }
            } else if (connection === 'open') {
                console.log(`[WA:${id}] Connected`);
                sessionData.status = 'connected';
                sessionData.qr = null;
                // Capture user info
                sessionData.user = {
                    id: sock.user?.id || '',
                    name: sock.user?.name || sock.user?.notify || undefined
                };
                db.query('UPDATE instances SET status = $status WHERE id = $id').run({ $status: 'running', $id: id });
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
        // For now, simple stop.
        db.query('DELETE FROM whatsapp_sessions WHERE id = $id').run({ $id: id });
    },
    formatJid: (number: string) => {
        if (!number) return '';
        if (number.includes('@s.whatsapp.net') || number.includes('@g.us')) return number;
        // Strip non-numeric chars
        const sanitized = number.replace(/\D/g, '');
        return `${sanitized}@s.whatsapp.net`;
    }
};
