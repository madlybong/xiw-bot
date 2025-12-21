import { jwt } from 'hono/jwt';
import { sign } from 'hono/jwt';
import { tokenManager } from './tokens';
import { createMiddleware } from 'hono/factory';

// In a real app, use Bun.env.JWT_SECRET
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-123';

const jwtMiddleware = jwt({
    secret: JWT_SECRET,
});

export const authMiddleware = createMiddleware(async (c, next) => {
    const authHeader = c.req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer xiw_')) {
        // API Token Flow
        const token = authHeader.split(' ')[1];
        if (!token) return c.json({ error: 'Missing Token' }, 401);

        const user = tokenManager.validate(token);

        if (user) {
            // Mock a JWT-like payload for compatibility with existing routes
            c.set('jwtPayload', {
                username: user.username,
                role: user.role,
                id: user.id,
                tokenId: user.tokenId, // [FIX] Correctly map the Token ID
                type: 'api_token',
                allowedInstances: user.allowedInstances // Array of instance IDs
            });

            // Security: Block Management Routes for API Tokens
            const path = c.req.path;
            if (path.startsWith('/api/users') || path.startsWith('/api/accounts') || path.startsWith('/api/tokens')) {
                return c.json({ error: 'API Tokens are restricted to Messaging and Status APIs only.' }, 403);
            }

            await next();
            return;
        } else {
            // Return 401 if token is invalid (don't fall back to JWT if they tried sending a token)
            return c.json({ error: 'Invalid API Token' }, 401);
        }
    }

    // Default Fallback: JWT Flow checking
    return jwtMiddleware(c, next);
});

export const createToken = async (payload: any) => {
    return await sign(payload, JWT_SECRET);
};
