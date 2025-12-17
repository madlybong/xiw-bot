import { jwt } from 'hono/jwt';
import { sign } from 'hono/jwt';

// In a real app, use Bun.env.JWT_SECRET
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-123';

export const authMiddleware = jwt({
    secret: JWT_SECRET,
});

export const createToken = async (payload: object) => {
    return await sign(payload, JWT_SECRET);
};
