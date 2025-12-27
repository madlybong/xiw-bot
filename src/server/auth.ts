import { jwt, sign, verify } from 'hono/jwt';
import { tokenManager } from './tokens';
import { createMiddleware } from 'hono/factory';

// In a real app, use Bun.env.JWT_SECRET
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-123';

const jwtMiddleware = jwt({
    secret: JWT_SECRET,
});

export const authMiddleware = createMiddleware(async (c, next) => {
    let authHeader = c.req.header('Authorization');
    const queryToken = c.req.query('token');

    // 1. Handle Query Parameter Token (Manual Verification)
    if (!authHeader && queryToken) {
        try {
            const payload = await verify(queryToken, JWT_SECRET);
            c.set('jwtPayload', payload);
            c.set('auth_type', 'jwt');
            c.set('actor_type', 'user');
            setQuotaHeaders(c, (payload as any).id);
            await next();
            return;
        } catch (e) {
            return c.json({ error: 'Invalid Query Token' }, 401);
        }
    }

    // 2. Handle API Tokens
    if (authHeader && authHeader.startsWith('Bearer xiw_')) {
        const token = authHeader.split(' ')[1];
        if (!token) return c.json({ error: 'Missing Token' }, 401);

        const user = tokenManager.validate(token);

        if (user) {
            c.set('jwtPayload', {
                username: user.username,
                role: user.role,
                id: user.id,
                tokenId: user.tokenId,
                type: 'api_token',
                allowedInstances: user.allowedInstances
            });
            c.set('auth_type', 'static_token');
            c.set('actor_type', 'api');
            setQuotaHeaders(c, user.id);

            // Security: Block Management Routes for API Tokens
            const path = c.req.path;
            if (path.startsWith('/api/users') || path.startsWith('/api/accounts') || path.startsWith('/api/tokens')) {
                return c.json({ error: 'API Tokens are restricted to Messaging and Status APIs only.' }, 403);
            }

            await next();
            return;
        } else {
            return c.json({ error: 'Invalid API Token' }, 401);
        }
    }

    // 3. Default Fallback: Standard JWT Header Check
    // Wrap jwtMiddleware to inject context on success
    return jwtMiddleware(c, async () => {
        const payload = c.get('jwtPayload');
        c.set('auth_type', 'jwt');
        c.set('actor_type', 'user');
        setQuotaHeaders(c, (payload as any).id);
        await next();
    });
});

export const createToken = async (payload: any) => {
    return await sign(payload, JWT_SECRET);
};

// [Quota] Helper
import db from './db';
const setQuotaHeaders = (c: any, userId: number) => {
    try {
        const user = db.query('SELECT message_limit, message_usage FROM users WHERE id = $id').get({ $id: userId }) as any;
        if (user) {
            c.header('X-Quota-Used', String(user.message_usage || 0));
            // -1 means unlimited usually, but let's just show raw value
            c.header('X-Quota-Remaining', user.message_limit === -1 ? 'Unlimited' : String(Math.max(0, user.message_limit - user.message_usage)));
        }
    } catch (e) { /* ignore */ }
};
