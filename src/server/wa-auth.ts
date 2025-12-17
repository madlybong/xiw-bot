import { proto } from '@whiskeysockets/baileys';
import { BufferJSON, initAuthCreds } from '@whiskeysockets/baileys';
import db from './db';

export const useSQLiteAuthState = async (sessionId: string) => {
    const saveCreds = async () => {
        const fullData = JSON.stringify({ creds, keys }, BufferJSON.replacer);
        const exists = db.query('SELECT 1 FROM whatsapp_sessions WHERE id = $id').get({ $id: sessionId });
        if (exists) {
            db.query('UPDATE whatsapp_sessions SET data = $data, updated_at = CURRENT_TIMESTAMP WHERE id = $id').run({ $id: sessionId, $data: fullData });
        } else {
            db.query('INSERT INTO whatsapp_sessions (id, data) VALUES ($id, $data)').run({ $id: sessionId, $data: fullData });
        }
    };

    // Load existing session or init new one
    const result = db.query('SELECT data FROM whatsapp_sessions WHERE id = $id').get({ $id: sessionId }) as { data: string } | null;

    let creds;
    let keys: any = {};

    if (result && result.data) {
        const parsed = JSON.parse(result.data, BufferJSON.reviver);
        creds = parsed.creds || initAuthCreds();
        keys = parsed.keys || {};
    } else {
        creds = initAuthCreds();
    }

    return {
        state: {
            creds,
            keys: {
                get: (type: string, ids: string[]) => {
                    const data: any = {};
                    for (const id of ids) {
                        // In a real optimized version, we might store keys in a separate table
                        // For simplicity, we are storing the entire massive state object in one row JSON
                        // This might be slow for huge sessions but fine for single-file bot
                        if (keys[type] && keys[type][id]) {
                            data[id] = keys[type][id];
                        }
                    }
                    return data;
                },
                set: (data: any) => {
                    for (const type in data) {
                        keys[type] = keys[type] || {};
                        Object.assign(keys[type], data[type]);
                    }
                    saveState();
                }
            }
        },
        saveCreds
    };

    async function saveState() {
        // We trigger save on every key update? accessible via the return object
        // Actually Baileys calls saveCreds separately.
        // For keys, we need to merge them into our memory state and then persist completely on 'saveCreds' call usually?
        // OR we persist periodically.
        // Given Baileys architecture, we will implement a basic "save everything" approach
        // But wait, the Keys 'set' method is synchronous usually in the interface but we can do async writes.

        const fullData = JSON.stringify({ creds, keys }, BufferJSON.replacer);
        const exists = db.query('SELECT 1 FROM whatsapp_sessions WHERE id = $id').get({ $id: sessionId });
        if (exists) {
            db.query('UPDATE whatsapp_sessions SET data = $data, updated_at = CURRENT_TIMESTAMP WHERE id = $id').run({ $id: sessionId, $data: fullData });
        } else {
            db.query('INSERT INTO whatsapp_sessions (id, data) VALUES ($id, $data)').run({ $id: sessionId, $data: fullData });
        }
    }
};
