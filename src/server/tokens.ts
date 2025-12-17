import db from './db';
import { randomBytes } from 'crypto';

export const tokenManager = {
    generate: (userId: number, name: string) => {
        // Generate a secure random token
        // Prefix 'xiw_' for easy identification
        const rawToken = 'xiw_' + randomBytes(32).toString('hex');

        // In a real app we would hash this before storing.
        // For simplicity/demo we might store raw but wait, 
        // Plan said "token (hashed)". Let's try to do simple storage for now to reduce complexity 
        // or use Bun's password hasher if suitable, OR just sha256.
        const hash = Bun.hash(rawToken).toString();

        db.query('INSERT INTO api_tokens (user_id, name, token_hash) VALUES ($user_id, $name, $hash)')
            .run({ $user_id: userId, $name: name, $hash: hash });

        return rawToken; // Show only once
    },

    validate: (rawToken: string) => {
        const hash = Bun.hash(rawToken).toString();
        const token = db.query('SELECT * FROM api_tokens WHERE token_hash = $hash').get({ $hash: hash }) as any;

        if (token) {
            db.query('UPDATE api_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE id = $id').run({ $id: token.id });
            return token;
        }
        return null;
    },

    list: (userId: number) => {
        return db.query('SELECT id, name, last_used_at, created_at FROM api_tokens WHERE user_id = $userId').all({ $userId: userId });
    },

    revoke: (userId: number, tokenId: number) => {
        db.query('DELETE FROM api_tokens WHERE id = $id AND user_id = $userId').run({ $id: tokenId, $userId: userId });
    }
};
