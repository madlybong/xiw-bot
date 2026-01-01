import { proto } from '@whiskeysockets/baileys';
import { BufferJSON, initAuthCreds } from '@whiskeysockets/baileys';
import type { AuthenticationCreds, AuthenticationState } from '@whiskeysockets/baileys';
import db from './db';

const TABLE_CREDS = 'wa_auth_creds';
const TABLE_KEYS = 'wa_auth_keys';

export const useSQLiteAuthState = async (sessionId: string): Promise<{ state: AuthenticationState, saveCreds: () => Promise<void> }> => {

    // 1. Try to migrate from legacy blob if needed
    const existingCreds = db.query(`SELECT 1 FROM ${TABLE_CREDS} WHERE instance_id = ?`).get(sessionId);
    if (!existingCreds) {
        const legacy = db.query('SELECT data FROM whatsapp_sessions WHERE id = ?').get(sessionId) as { data: string } | null;
        if (legacy && legacy.data) {
            console.log(`[Auth] Migrating session ${sessionId} to new schema...`);
            try {
                const parsed = JSON.parse(legacy.data, BufferJSON.reviver);
                const creds = parsed.creds;
                const keys = parsed.keys;

                const tx = db.transaction(() => {
                    // Save Creds
                    db.run(`INSERT INTO ${TABLE_CREDS} (instance_id, creds) VALUES (?, ?)`, [sessionId, JSON.stringify(creds, BufferJSON.replacer)]);

                    // Save Keys
                    for (const type in keys) {
                        for (const id in keys[type]) {
                            const val = keys[type][id];
                            db.run(`INSERT INTO ${TABLE_KEYS} (instance_id, type, key_id, value) VALUES (?, ?, ?, ?)`,
                                [sessionId, type, id, JSON.stringify(val, BufferJSON.replacer)]);
                        }
                    }
                });
                tx();
                console.log(`[Auth] Migration for ${sessionId} successful.`);
            } catch (e) {
                console.error(`[Auth] Migration failed for ${sessionId}`, e);
            }
        }
    }

    // 2. Load Creds
    let creds: AuthenticationCreds;
    const credsRow = db.query(`SELECT creds FROM ${TABLE_CREDS} WHERE instance_id = ?`).get(sessionId) as { creds: string } | null;

    if (credsRow) {
        creds = JSON.parse(credsRow.creds, BufferJSON.reviver);
    } else {
        creds = initAuthCreds();
    }

    // 3. Define saveCreds
    const saveCreds = async () => {
        const json = JSON.stringify(creds, BufferJSON.replacer);
        db.run(`INSERT OR REPLACE INTO ${TABLE_CREDS} (instance_id, creds) VALUES (?, ?)`, [sessionId, json]);
    };

    return {
        state: {
            creds,
            keys: {
                get: (type: string, ids: string[]) => {
                    const data: any = {};
                    if (ids.length === 0) return data;

                    // SQLite variable limit safety check
                    const rows = [];
                    const CHUNK_SIZE = 50;

                    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
                        const chunk = ids.slice(i, i + CHUNK_SIZE);
                        const placeholders = chunk.map(() => '?').join(',');
                        const result = db.query(`SELECT key_id, value FROM ${TABLE_KEYS} WHERE instance_id = ? AND type = ? AND key_id IN (${placeholders})`)
                            .all(sessionId, type, ...chunk) as { key_id: string, value: string }[];
                        rows.push(...result);
                    }

                    rows.forEach(row => {
                        data[row.key_id] = JSON.parse(row.value, BufferJSON.reviver);
                    });

                    return data;
                },
                set: (data: any) => {
                    const tx = db.transaction(() => {
                        for (const type in data) {
                            for (const id in data[type]) {
                                const val = data[type][id];
                                if (val === null || val === undefined) {
                                    db.run(`DELETE FROM ${TABLE_KEYS} WHERE instance_id = ? AND type = ? AND key_id = ?`, [sessionId, type, id]);
                                } else {
                                    const str = JSON.stringify(val, BufferJSON.replacer);
                                    db.run(`INSERT OR REPLACE INTO ${TABLE_KEYS} (instance_id, type, key_id, value) VALUES (?, ?, ?, ?)`,
                                        [sessionId, type, id, str]);
                                }
                            }
                        }
                    });
                    tx();
                }
            }
        },
        saveCreds
    };
};
