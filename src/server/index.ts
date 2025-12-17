import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { logger } from 'hono/logger';
import { getAsset } from './assets.gen'; // This file will be generated
// mime import removed as it is not exported from hono/adapter directly in this version
// We will manually set headers or use a helper if needed
import db from './db';
import { authMiddleware, createToken, JWT_SECRET } from './auth';
import { waManager } from './wa';
import { tokenManager } from './tokens';
import { toDataURL } from 'qrcode';

// Simple password hashing (for demo purposes using Bun.hash, in prod use AccessControl/Argon2 properly)
// We already have password_hash in DB
const hashPassword = (p: string) => Bun.hash(p).toString();

const app = new Hono();

app.use('*', logger());

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', version: '1.0.0', db: 'connected' });
});

app.post('/api/auth/login', async (c) => {
  const { username, password } = await c.req.json();

  // Verify against DB
  const user = db.query('SELECT * FROM users WHERE username = $username').get({ $username: username }) as any;

  if (user) {
    const hash = Bun.hash(password).toString();
    // Compare hashes (simple)
    if (user.password_hash === hash) {
      const token = await createToken({ username, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 });
      return c.json({ token });
    }
  }

  // Initial Admin Setup if no users exist
  if (username === 'admin' && password === 'admin') {
    const count = db.query('SELECT count(*) as c FROM users').get() as any;
    if (count.c === 0) {
      // Create default admin
      const hash = Bun.hash('admin').toString();
      db.query('INSERT INTO users (username, password_hash, role) VALUES ($u, $p, $r)').run({ $u: 'admin', $p: hash, $r: 'admin' });
      const token = await createToken({ username, role: 'admin', exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 });
      return c.json({ token });
    }
  }

  return c.json({ error: 'Invalid credentials' }, 401);
});

// User Management APIs
app.get('/api/users', authMiddleware, (c) => {
  // Check if admin
  const payload = c.get('jwtPayload');
  if (payload.role !== 'admin') return c.json({ error: 'Unauthorized' }, 403);

  const users = db.query('SELECT id, username, role, created_at FROM users').all();
  return c.json({ users });
});

app.post('/api/users', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload');
  if (payload.role !== 'admin') return c.json({ error: 'Unauthorized' }, 403);

  const { username, password, role } = await c.req.json();
  const hash = Bun.hash(password).toString();
  try {
    db.query('INSERT INTO users (username, password_hash, role) VALUES ($u, $p, $r)').run({ $u: username, $p: hash, $r: role || 'agent' });
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: 'Failed' }, 500);
  }
});

app.delete('/api/users/:id', authMiddleware, (c) => {
  const payload = c.get('jwtPayload');
  if (payload.role !== 'admin') return c.json({ error: 'Unauthorized' }, 403);
  const id = c.req.param('id');
  db.query('DELETE FROM users WHERE id = $id').run({ $id: id });
  return c.json({ success: true });
});

// Protected Route Example
app.get('/api/protected', authMiddleware, (c) => {
  const payload = c.get('jwtPayload');
  return c.json({ message: 'You are authenticated', user: payload });
});

// Account Management APIs
app.get('/api/accounts', authMiddleware, (c) => {
  const accounts = db.query('SELECT * FROM instances ORDER BY created_at DESC').all();
  return c.json({ accounts });
});

app.post('/api/accounts', authMiddleware, async (c) => {
  const { name, config } = await c.req.json();
  try {
    db.query('INSERT INTO instances (name, config) VALUES ($name, $config)').run({ $name: name, $config: config });
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: 'Failed to create account' }, 500);
  }
});

app.delete('/api/accounts/:id', authMiddleware, (c) => {
  const id = c.req.param('id');
  db.query('DELETE FROM instances WHERE id = $id').run({ $id: id });
  // Also stop session
  waManager.deleteSession(id);
  return c.json({ success: true });
});

// WA Endpoints
app.post('/api/wa/start/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  await waManager.startSession(id);
  return c.json({ success: true });
});

app.get('/api/wa/status/:id', authMiddleware, (c) => {
  const id = c.req.param('id');
  const session = waManager.getSession(id);

  if (!session) return c.json({ status: 'stopped', qr: null });

  return c.json({
    status: session.status,
    qr: session.qr
  });
});

app.post('/api/wa/logout/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const session = waManager.getSession(id);
  if (session?.socket) {
    await session.socket.logout();
  }
  await waManager.deleteSession(id);
  return c.json({ success: true });
});

// Message Sending APIs
app.post('/api/wa/send/text/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const { to, message } = await c.req.json();
  const session = waManager.getSession(id);

  if (!session || !session.socket) {
    return c.json({ error: 'Session not connected' }, 400);
  }

  const jid = waManager.formatJid(to);
  try {
    await session.socket.sendMessage(jid, { text: message });
    return c.json({ success: true, jid });
  } catch (error: any) {
    return c.json({ error: 'Failed to send message', details: error.message }, 500);
  }
});

app.post('/api/wa/send/image/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const { to, url, caption } = await c.req.json();
  const session = waManager.getSession(id);

  if (!session || !session.socket) {
    return c.json({ error: 'Session not connected' }, 400);
  }

  const jid = waManager.formatJid(to);
  try {
    // Baileys handles remote URLs automatically if provided in { url: ... }
    await session.socket.sendMessage(jid, {
      image: { url },
      caption: caption
    });
    return c.json({ success: true, jid });
  } catch (error: any) {
    return c.json({ error: 'Failed to send image', details: error.message }, 500);
  }
});

app.post('/api/wa/send/video/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const { to, url, caption } = await c.req.json();
  const session = waManager.getSession(id);

  if (!session || !session.socket) {
    return c.json({ error: 'Session not connected' }, 400);
  }

  const jid = waManager.formatJid(to);
  try {
    await session.socket.sendMessage(jid, {
      video: { url },
      caption: caption,
      mimetype: 'video/mp4' // Basic default, Baileys usually detects
    });
    return c.json({ success: true, jid });
  } catch (error: any) {
    return c.json({ error: 'Failed to send video', details: error.message }, 500);
  }
});

app.post('/api/wa/send/document/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const { to, url, filename, caption } = await c.req.json();
  const session = waManager.getSession(id);

  if (!session || !session.socket) {
    return c.json({ error: 'Session not connected' }, 400);
  }

  const jid = waManager.formatJid(to);
  try {
    await session.socket.sendMessage(jid, {
      document: { url },
      fileName: filename || 'document',
      mimetype: 'application/octet-stream', // Should ideally be passed in or detected
      caption: caption
    });
    return c.json({ success: true, jid });
  } catch (error: any) {
    return c.json({ error: 'Failed to send document', details: error.message }, 500);
  }
});

// API Token Management
app.get('/api/tokens', authMiddleware, (c) => {
  const payload = c.get('jwtPayload');
  console.log('[DEBUG] GET /api/tokens Payload:', payload);

  // Temporary: fetch user by username from payload
  const user = db.query('SELECT id FROM users WHERE username = $username').get({ $username: payload.username }) as any;
  console.log('[DEBUG] GET /api/tokens Found User:', user);

  if (!user) return c.json({ error: 'User not found', username: payload.username }, 404);

  const tokens = tokenManager.list(user.id);
  return c.json({ tokens });
});

app.post('/api/tokens', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload');
  console.log('[DEBUG] POST /api/tokens Payload:', payload);

  const user = db.query('SELECT id FROM users WHERE username = $username').get({ $username: payload.username }) as any;
  console.log('[DEBUG] POST /api/tokens Found User:', user);

  const { name } = await c.req.json();

  if (!user) return c.json({ error: 'User not found', username: payload.username }, 404);

  const rawToken = tokenManager.generate(user.id, name);
  return c.json({ token: rawToken });
});

app.delete('/api/tokens/:id', authMiddleware, (c) => {
  const payload = c.get('jwtPayload');
  const user = db.query('SELECT id FROM users WHERE username = $username').get({ $username: payload.username }) as any;
  const id = c.req.param('id');

  tokenManager.revoke(user.id, Number(id));
  return c.json({ success: true });
});

// Serve embedded assets
app.use('*', async (c, next) => {
  const path = c.req.path === '/' ? 'index.html' : c.req.path.slice(1);
  const content = getAsset(path);

  if (content) {
    // Basic mime type handling - Hono might have a better way or we use a small helper
    // For now, let's just do basic ones
    if (path.endsWith('.html')) c.header('Content-Type', 'text/html');
    else if (path.endsWith('.js')) c.header('Content-Type', 'application/javascript');
    else if (path.endsWith('.css')) c.header('Content-Type', 'text/css');
    else if (path.endsWith('.png')) c.header('Content-Type', 'image/png');
    else if (path.endsWith('.svg')) c.header('Content-Type', 'image/svg+xml');

    else if (path.endsWith('.svg')) c.header('Content-Type', 'image/svg+xml');

    return c.body(content as any);
  }

  // SPA Fallback: if not found and not an API route, serve index.html
  if (!c.req.path.startsWith('/api')) {
    const index = getAsset('index.html');
    if (index) {
      c.header('Content-Type', 'text/html');
      return c.body(index as any);
    }
  }

  await next();
});

console.log('Server starting on port 3000');

export default {
  port: 3000,
  fetch: app.fetch,
};
