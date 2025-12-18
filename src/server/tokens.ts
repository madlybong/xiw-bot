import db from './db';
import { randomBytes } from 'crypto';

export const tokenManager = {
    generate: (assignedUserId: number, name: string, instanceIds: number[]) => {
        // Generate a secure random token
        const rawToken = 'xiw_' + randomBytes(32).toString('hex');

        // Simple hashing (Bun.hash is consistent)
        const hash = Bun.hash(rawToken).toString();

        const insert = db.query('INSERT INTO api_tokens (assigned_user_id, name, token_hash) VALUES ($uid, $name, $hash) RETURNING id');
        const result = insert.get({ $uid: assignedUserId, $name: name, $hash: hash }) as { id: number };

        const tokenId = result.id;

        // Map instances
        const insertMap = db.prepare('INSERT INTO token_instances (token_id, instance_id) VALUES ($tid, $iid)');
        const transaction = db.transaction((ids: number[]) => {
            for (const iid of ids) {
                insertMap.run({ $tid: tokenId, $iid: iid });
            }
        });
        transaction(instanceIds);

        return rawToken;
    },

    validate: (rawToken: string) => {
        const hash = Bun.hash(rawToken).toString();
        // Join with users to get username/role
        const token = db.query(`
            SELECT t.id, t.assigned_user_id, u.username, u.role 
            FROM api_tokens t
            JOIN users u ON t.assigned_user_id = u.id
            WHERE t.token_hash = $hash
        `).get({ $hash: hash }) as any;

        if (token) {
            db.query('UPDATE api_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE id = $id').run({ $id: token.id });

            // Fetch allowed instances
            const instances = db.query('SELECT instance_id FROM token_instances WHERE token_id = $tid').all({ $tid: token.id }) as { instance_id: number }[];
            const allowedIds = instances.map(i => i.instance_id);

            return {
                id: token.assigned_user_id,
                username: token.username,
                role: token.role,
                allowedInstances: allowedIds
            };
        }
        return null;
    },

    list: () => {
        // Admin view: list all tokens with their assigned user
        return db.query(`
            SELECT t.id, t.name, t.last_used_at, t.created_at, u.username as assigned_user
            FROM api_tokens t
            JOIN users u ON t.assigned_user_id = u.id
            ORDER BY t.created_at DESC
        `).all();
    },

    revoke: (id: number) => {
        db.query('DELETE FROM api_tokens WHERE id = $id').run({ $id: id });
    }
};
