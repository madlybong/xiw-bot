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

// Safety Helper: Check Usage & Status
const checkUsage = (userId: number) => {
  const user = db.query('SELECT * FROM users WHERE id = $id').get({ $id: userId }) as any;
  if (!user) return { allowed: false, error: 'User not found' };

  if (user.status === 'suspended') return { allowed: false, error: 'Account suspended' };
  if (user.role === 'admin') return { allowed: true }; // Admins bypass limits? Or enforce? Let's bypass for now or treat same. Requirement says "Agent limits".

  // Reset Logic
  const lastReset = new Date(user.last_usage_reset);
  const now = new Date();
  let shouldReset = false;

  if (user.limit_frequency === 'daily') {
    if (lastReset.getDate() !== now.getDate() || lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
      shouldReset = true;
    }
  } else if (user.limit_frequency === 'monthly') {
    if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
      shouldReset = true;
    }
  }

  if (shouldReset) {
    db.query('UPDATE users SET message_usage = 0, last_usage_reset = CURRENT_TIMESTAMP WHERE id = $id').run({ $id: userId });
    user.message_usage = 0; // Local update
  }

  if (user.limit_frequency !== 'unlimited' && user.message_limit !== -1 && user.message_usage >= user.message_limit) {
    return { allowed: false, error: 'Message limit reached' };
  }

  return { allowed: true };
};

const incrementUsage = (userId: number, instanceId: number, action: string, details: any) => {
  db.query('UPDATE users SET message_usage = message_usage + 1 WHERE id = $id').run({ $id: userId });
  db.query('INSERT INTO audit_logs (user_id, instance_id, action, details) VALUES ($uid, $iid, $act, $det)').run({
    $uid: userId, $iid: instanceId, $act: action, $det: JSON.stringify(details)
  });
};

const app = new Hono();

// CORS Middleware
import { cors } from 'hono/cors';
app.use('/api/*', cors({
  origin: '*', // Allow all for now, or make configurable later
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', logger());

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', version: '1.0.0', db: 'connected' });
});

app.post('/api/auth/login', async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ error: 'Invalid JSON body or empty payload' }, 400);
  }
  const { username, password } = body;

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

  // Initial Admin Setup removed - use CLI args
  // if (username === 'admin' && password === 'admin') { ... }

  return c.json({ error: 'Invalid credentials' }, 401);
});

// User Management APIs
app.get('/api/users', authMiddleware, (c) => {
  // Check if admin
  const payload = c.get('jwtPayload');
  if (payload.role !== 'admin') return c.json({ error: 'Unauthorized' }, 403);

  const users = db.query('SELECT id, username, role, status, message_limit, message_usage, limit_frequency, created_at FROM users').all();
  return c.json({ users });
});

app.post('/api/users', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload');
  if (payload.role !== 'admin') return c.json({ error: 'Unauthorized' }, 403);

  let body;
  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }
  const { username, password, role, message_limit, limit_frequency, status } = body;

  const hash = Bun.hash(password).toString();
  try {
    db.query('INSERT INTO users (username, password_hash, role, message_limit, limit_frequency, status) VALUES ($u, $p, $r, $ml, $lf, $st)')
      .run({
        $u: username,
        $p: hash,
        $r: role || 'agent',
        $ml: message_limit || 1000,
        $lf: limit_frequency || 'daily',
        $st: status || 'active'
      });
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: 'Failed (Username might exist)' }, 500);
  }
});

app.put('/api/users/:id', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload');
  if (payload.role !== 'admin') return c.json({ error: 'Unauthorized' }, 403);
  const id = c.req.param('id');

  let body;
  try { body = await c.req.json(); } catch (e) { return c.json({ error: 'Invalid JSON' }, 400); }
  const { password, role, message_limit, limit_frequency, status } = body;

  try {
    if (password) {
      const hash = Bun.hash(password).toString();
      db.query('UPDATE users SET password_hash = $p WHERE id = $id').run({ $p: hash, $id: id });
    }

    db.query(`UPDATE users SET 
            role = COALESCE($r, role), 
            message_limit = COALESCE($ml, message_limit), 
            limit_frequency = COALESCE($lf, limit_frequency),
            status = COALESCE($st, status)
            WHERE id = $id`
    ).run({
      $r: role,
      $ml: message_limit,
      $lf: limit_frequency,
      $st: status,
      $id: id
    });

    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: 'Update Failed' }, 500);
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
  const payload = c.get('jwtPayload');
  if (payload.type === 'api_token') return c.json({ error: 'API Tokens cannot create accounts' }, 403);

  let body;
  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }
  const { name, config } = body;
  try {
    db.query('INSERT INTO instances (name, config) VALUES ($name, $config)').run({ $name: name, $config: config });
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: 'Failed to create account' }, 500);
  }
});

app.delete('/api/accounts/:id', authMiddleware, (c) => {
  const payload = c.get('jwtPayload');
  if (payload.type === 'api_token') return c.json({ error: 'API Tokens cannot delete accounts' }, 403);

  const id = c.req.param('id');
  db.query('DELETE FROM instances WHERE id = $id').run({ $id: id });
  // Also stop session
  waManager.deleteSession(id);
  return c.json({ success: true });
});

// WA Endpoints
app.post('/api/wa/start/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');

  // Scoped Access Check
  const payload = c.get('jwtPayload');
  if (payload.type === 'api_token') {
    const allowed = payload.allowedInstances as number[];
    if (!allowed.includes(Number(id))) return c.json({ error: 'Access Denied to this instance' }, 403);
  }

  await waManager.startSession(id);
  return c.json({ success: true });
});

// Instance Management
app.post('/api/instances', authMiddleware, async (c) => {
  const { name } = await c.req.json();
  if (!name) return c.json({ error: 'Name is required' }, 400);

  try {
    const info = db.query('INSERT INTO instances (name, status) VALUES (?1, ?2) RETURNING id').get(name, 'stopped') as any;
    // Log action
    const user = c.get('jwtPayload');
    db.query('INSERT INTO audit_logs (user_id, action, details) VALUES ($uid, $act, $det)').run({
      $uid: user.id,
      $act: 'create_instance',
      $det: JSON.stringify({ name, id: info.id })
    });
    return c.json({ success: true, id: info.id });
  } catch (e: any) {
    return c.json({ error: 'Failed to create instance', details: e.message }, 500);
  }
});

app.delete('/api/instances/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  // Stop session first
  try {
    await waManager.deleteSession(id);
    db.query('DELETE FROM instances WHERE id = $id').run({ $id: id });
    const user = c.get('jwtPayload');
    db.query('INSERT INTO audit_logs (user_id, action, details) VALUES ($uid, $act, $det)').run({
      $uid: user.id,
      $act: 'delete_instance',
      $det: JSON.stringify({ id })
    });
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: 'Failed' }, 500);
  }
});

// WA Routing
app.get('/api/wa/status', authMiddleware, (c) => {
  const payload = c.get('jwtPayload');
  let instances = [];

  // Determine which instances to show
  if (payload.role === 'admin') {
    instances = db.query('SELECT id, name FROM instances').all() as any[];
  } else {
    // For agents, show assigned instances via tokens
    // "details of self" implies "details of what is assigned to me"
    // Since users role is checked, we assume dashboard user ID might match assigned_user_id (if they are same entity)
    // Check if there is a User ID (payload.sub is usually username). Wait, we need ID.
    // fetch user ID from username
    const user = db.query('SELECT id FROM users WHERE username = $username').get({ $username: payload.username }) as any;

    if (user) {
      // Get instances where this user is assigned via tokens
      // Detailed query: 
      // SELECT distinct i.id, i.name FROM instances i 
      // JOIN token_instances ti ON i.id = ti.instance_id
      // JOIN api_tokens at ON ti.token_id = at.id
      // WHERE at.assigned_user_id = $uid
      instances = db.query(`
            SELECT DISTINCT i.id, i.name 
            FROM instances i 
            JOIN token_instances ti ON i.id = ti.instance_id 
            JOIN api_tokens at ON ti.token_id = at.id 
            WHERE at.assigned_user_id = $uid
         `).all({ $uid: user.id }) as any[];
    }
  }

  // Map to status
  const statuses = instances.map(inst => {
    const session = waManager.getSession(inst.id.toString());
    return {
      id: inst.id,
      name: inst.name,
      status: session ? session.status : 'stopped',
      qr: session ? session.qr : null,
      user: session ? session.user : undefined
    };
  });

  return c.json({ instances: statuses });
});

app.get('/api/wa/status/:id', authMiddleware, (c) => {
  const id = c.req.param('id');

  // Scoped Access Check
  const payload = c.get('jwtPayload');
  if (payload.type === 'api_token') {
    const allowed = payload.allowedInstances as number[];
    if (!allowed.includes(Number(id))) return c.json({ error: 'Access Denied to this instance' }, 403);
  }

  const session = waManager.getSession(id);

  if (!session) return c.json({ status: 'stopped', qr: null });

  return c.json({
    status: session.status,
    qr: session.qr,
    user: session.user
  });
});

app.post('/api/wa/logout/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const payload = c.get('jwtPayload');

  // Access check
  if (payload.type === 'api_token') {
    const allowed = payload.allowedInstances as number[];
    if (!allowed.includes(Number(id))) return c.json({ error: 'Access Denied' }, 403);
  }

  await waManager.deleteSession(id);

  // Update instance status in DB to match
  db.query('UPDATE instances SET status = $status WHERE id = $id').run({ $status: 'stopped', $id: id });

  return c.json({ success: true });
});

// Message Sending APIs
app.post('/api/wa/send/text/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');

  // Scoped Access Check
  const payload = c.get('jwtPayload');

  // Resolve User ID for Usage Check
  let userId = -1;
  if (payload.type === 'api_token') {
    const allowed = payload.allowedInstances as number[];
    if (!allowed.includes(Number(id))) return c.json({ error: 'Access Denied to this instance' }, 403);

    // Get assigned_user_id from token
    const tokenInfo = db.query('SELECT assigned_user_id FROM api_tokens WHERE id = $tid').get({ $tid: payload.tokenId }) as any;
    if (tokenInfo) userId = tokenInfo.assigned_user_id;

  } else if (payload.id) {
    userId = payload.id; // Dashboard User
  }

  // Check Limits
  if (userId !== -1) {
    const check = checkUsage(userId);
    if (!check.allowed) return c.json({ error: check.error }, 403);
  }

  let body;
  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }
  const { to, message } = body;
  const session = waManager.getSession(id);

  if (!session || !session.socket) {
    return c.json({ error: 'Session not connected' }, 400);
  }

  const jid = waManager.formatJid(to);
  try {
    await session.socket.sendMessage(jid, { text: message });
    if (userId !== -1) incrementUsage(userId, Number(id), 'send_text', { to: jid });
    checkContact(to);
    return c.json({ success: true, jid });
  } catch (error: any) {
    return c.json({ error: 'Failed to send message', details: error.message }, 500);
  }
});

app.post('/api/wa/send/image/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');

  // Scoped Access Check
  const payload = c.get('jwtPayload');

  // Resolve User ID for Usage Check
  let userId = -1;
  if (payload.type === 'api_token') {
    const allowed = payload.allowedInstances as number[];
    if (!allowed.includes(Number(id))) return c.json({ error: 'Access Denied to this instance' }, 403);

    const tokenInfo = db.query('SELECT assigned_user_id FROM api_tokens WHERE id = $tid').get({ $tid: payload.tokenId }) as any;
    if (tokenInfo) userId = tokenInfo.assigned_user_id;
  } else if (payload.id) userId = payload.id;

  if (userId !== -1) {
    const check = checkUsage(userId);
    if (!check.allowed) return c.json({ error: check.error }, 403);
  }

  let body;
  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }
  const { to, url, caption } = body;
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
    if (userId !== -1) incrementUsage(userId, Number(id), 'send_image', { to: jid });
    checkContact(to);
    return c.json({ success: true, jid });
  } catch (error: any) {
    return c.json({ error: 'Failed to send image', details: error.message }, 500);
  }
});

app.post('/api/wa/send/video/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');

  // Scoped Access Check
  const payload = c.get('jwtPayload');

  let userId = -1;
  if (payload.type === 'api_token') {
    const allowed = payload.allowedInstances as number[];
    if (!allowed.includes(Number(id))) return c.json({ error: 'Access Denied to this instance' }, 403);
    const tokenInfo = db.query('SELECT assigned_user_id FROM api_tokens WHERE id = $tid').get({ $tid: payload.tokenId }) as any;
    if (tokenInfo) userId = tokenInfo.assigned_user_id;

  } else if (payload.id) userId = payload.id;

  if (userId !== -1) {
    const check = checkUsage(userId);
    if (!check.allowed) return c.json({ error: check.error }, 403);
  }

  let body;
  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }
  const { to, url, caption } = body;
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
    if (userId !== -1) incrementUsage(userId, Number(id), 'send_video', { to: jid });
    checkContact(to);
    return c.json({ success: true, jid });
  } catch (error: any) {
    return c.json({ error: 'Failed to send video', details: error.message }, 500);
  }
});

app.post('/api/wa/send/document/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');

  // Scoped Access Check
  const payload = c.get('jwtPayload');

  let userId = -1;
  if (payload.type === 'api_token') {
    const allowed = payload.allowedInstances as number[];
    if (!allowed.includes(Number(id))) return c.json({ error: 'Access Denied to this instance' }, 403);
    const tokenInfo = db.query('SELECT assigned_user_id FROM api_tokens WHERE id = $tid').get({ $tid: payload.tokenId }) as any;
    if (tokenInfo) userId = tokenInfo.assigned_user_id;

  } else if (payload.id) userId = payload.id;

  if (userId !== -1) {
    const check = checkUsage(userId);
    if (!check.allowed) return c.json({ error: check.error }, 403);
  }

  let body;
  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }
  const { to, url, filename, caption } = body;
  const session = waManager.getSession(id);

  if (!session || !session.socket) {
    return c.json({ error: 'Session not connected' }, 400);
  }

  const jid = waManager.formatJid(to);
  try {
    await session.socket.sendMessage(jid, {
      document: { url },
      fileName: filename || 'document',
      mimetype: 'application/octet-stream',
      caption: caption
    });
    if (userId !== -1) incrementUsage(userId, Number(id), 'send_document', { to: jid });

    // Auto-save contact
    checkContact(to);

    return c.json({ success: true, jid });
  } catch (error: any) {
    return c.json({ error: 'Failed to send document', details: error.message }, 500);
  }
});

// --- Contacts API ---

// Helper: Check and Add Contact
const checkContact = (phone: string, name?: string) => {
  try {
    const cleanPhone = phone.replace(/\D/g, ''); // Basic cleaning
    const exists = db.query('SELECT id FROM contacts WHERE phone = $phone').get({ $phone: cleanPhone });
    if (!exists) {
      db.query('INSERT INTO contacts (phone, name, source) VALUES ($phone, $name, "auto")').run({
        $phone: cleanPhone,
        $name: name || `Unknown ${cleanPhone.slice(-4)}`
      });
    }
  } catch (e) {
    // Silently fail to not disrupt messaging flow
    console.error('Auto-save contact failed', e);
  }
}

app.get('/api/contacts', authMiddleware, (c) => {
  const contacts = db.query('SELECT * FROM contacts ORDER BY created_at DESC').all();
  return c.json({ contacts });
});

app.post('/api/contacts', authMiddleware, async (c) => {
  const { name, phone, email, tags, notes } = await c.req.json();
  if (!phone) return c.json({ error: 'Phone is required' }, 400);

  try {
    db.query('INSERT INTO contacts (name, phone, email, tags, notes, source) VALUES ($name, $phone, $email, $tags, $notes, "manual")').run({
      $name: name, $phone: phone.replace(/\D/g, ''), $email: email, $tags: tags, $notes: notes
    });
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message.includes('UNIQUE constraint failed')) return c.json({ error: 'Contact already exists' }, 409);
    return c.json({ error: e.message }, 500);
  }
});

app.put('/api/contacts/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const { name, email, tags, notes } = await c.req.json();
  db.query('UPDATE contacts SET name = $name, email = $email, tags = $tags, notes = $notes WHERE id = $id').run({
    $name: name, $email: email, $tags: tags, $notes: notes, $id: id
  });
  return c.json({ success: true });
});

app.delete('/api/contacts/:id', authMiddleware, (c) => {
  const id = c.req.param('id');
  db.query('DELETE FROM contacts WHERE id = $id').run({ $id: id });
  return c.json({ success: true });
});

app.get('/api/contacts/export', authMiddleware, (c) => {
  const contacts = db.query('SELECT * FROM contacts').all() as any[];
  const csvRows = ['ID,Name,Phone,Email,Tags,Notes,Source,Created At'];

  contacts.forEach(contact => {
    const row = [
      contact.id,
      `"${contact.name || ''}"`,
      `"${contact.phone}"`,
      `"${contact.email || ''}"`,
      `"${contact.tags || ''}"`,
      `"${contact.notes || ''}"`,
      contact.source,
      contact.created_at
    ];
    csvRows.push(row.join(','));
  });

  return c.text(csvRows.join('\n'), 200, {
    'Content-Type': 'text/csv',
    'Content-Disposition': 'attachment; filename="contacts.csv"'
  });
});

app.post('/api/contacts/import', authMiddleware, async (c) => {
  const body = await c.req.parseBody();
  const file = body['file'];
  if (file instanceof File) {
    const text = await file.text();
    const lines = text.split('\n').slice(1); // Skip header
    let imported = 0;

    const insert = db.prepare('INSERT OR IGNORE INTO contacts (name, phone, email, tags, notes, source) VALUES ($name, $phone, $email, $tags, $notes, "import")');
    const update = db.prepare('UPDATE contacts SET name = $name, email = $email, tags = $tags, notes = $notes WHERE phone = $phone');

    const transaction = db.transaction((rows) => {
      for (const row of rows) {
        // VERY simple CSV parsing, assumes no commas in fields for now or standard quotes
        // For a robust solution, use a CSV parser library. 
        // Trying a basic regex split handles some quotes:
        const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || row.split(',');
        if (cols.length < 2) continue;

        // Assuming format: Name, Phone, Email, Tags, Notes
        let name = cols[0]?.replace(/^"|"$/g, '').trim();
        let phone = cols[1]?.replace(/^"|"$/g, '').replace(/\D/g, '').trim();
        let email = cols[2]?.replace(/^"|"$/g, '').trim();
        let tags = cols[3]?.replace(/^"|"$/g, '').trim();
        let notes = cols[4]?.replace(/^"|"$/g, '').trim();

        if (phone) {
          insert.run({ $name: name, $phone: phone, $email: email, $tags: tags, $notes: notes });
          // Optionally update if exists? Let's just Insert or Ignore for now to verify.
          // Actually, let's try update if it fails to insert (meaning exists)?
          // No, INSERT OR IGNORE is safest for imports to not overwrite good data with bad import.
          imported++;
        }
      }
    });

    try {
      transaction(lines);
      return c.json({ success: true, count: imported });
    } catch (e: any) {
      return c.json({ error: 'Import failed', details: e.message }, 500);
    }
  }
  return c.json({ error: 'No file uploaded' }, 400);
});

// Update Text/Image/Video handlers to also Auto-Save
// We need to inject checkContact(to) into other handlers too.
// Instead of rewriting all of them, I'll assume I should have done it in one go.
// I will apply edits to them in a subsequent step if needed, or if I can reach them here?
// Lines 450-471 covered sendDocument. 
// I need to patch sendText (lines ~260), sendImage (~330), sendVideo (~370).

// --- End Contacts API ---

// API Token Management
app.get('/api/tokens', authMiddleware, (c) => {
  const payload = c.get('jwtPayload');
  if (payload.role !== 'admin') return c.json({ error: 'Only admins can list tokens' }, 403);

  const tokens = tokenManager.list();
  return c.json({ tokens });
});

app.post('/api/tokens', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload');
  if (payload.role !== 'admin') return c.json({ error: 'Only admins can generate tokens' }, 403);

  let body;
  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }
  const { name, userId, instanceIds } = body;

  if (!userId || !instanceIds || !Array.isArray(instanceIds)) {
    return c.json({ error: 'Missing userId or instanceIds array' }, 400);
  }

  const rawToken = tokenManager.generate(Number(userId), name, instanceIds);
  return c.json({ token: rawToken });
});

app.delete('/api/tokens/:id', authMiddleware, (c) => {
  const payload = c.get('jwtPayload');
  if (payload.role !== 'admin') return c.json({ error: 'Only admins can revoke tokens' }, 403);

  const id = c.req.param('id');
  tokenManager.revoke(Number(id));
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

// CLI Admin Management
const args = Bun.argv;
const adminUserIndex = args.indexOf('--admin-user');
const adminPassIndex = args.indexOf('--admin-password');

if (adminUserIndex !== -1 && adminPassIndex !== -1) {
  const username = args[adminUserIndex + 1];
  const password = args[adminPassIndex + 1];

  if (username && password) {
    console.log(`Setting up admin user: ${username}`);
    const hash = Bun.hash(password).toString();

    // Check if admin exists
    const existing = db.query("SELECT id FROM users WHERE role = 'admin'").get() as any;

    if (existing) {
      // Update existing admin
      console.log('Updating existing admin credentials...');
      db.query('UPDATE users SET username = $u, password_hash = $p WHERE id = $id').run({ $u: username, $p: hash, $id: existing.id });
    } else {
      // Create new admin
      console.log('Creating new admin user...');
      try {
        db.query('INSERT INTO users (username, password_hash, role) VALUES ($u, $p, "admin")').run({ $u: username, $p: hash });
      } catch (e: any) {
        console.error('Failed to create admin:', e.message);
        process.exit(1);
      }
    }
    console.log('Admin setup complete.');
    process.exit(0);
  } else {
    console.error('Usage: --admin-user <username> --admin-password <password>');
    process.exit(1);
  }
}

console.log('Server starting on port 3000');

// --- Audit Logs Export ---
app.get('/api/logs/export', authMiddleware, (c) => {
  const payload = c.get('jwtPayload');
  if (payload.role !== 'admin') return c.json({ error: 'Only admins can export logs' }, 403);

  const { startDate, endDate, userId } = c.req.query();

  let query = 'SELECT l.*, u.username FROM audit_logs l LEFT JOIN users u ON l.user_id = u.id WHERE 1=1';
  const params: any = {};

  if (startDate) {
    query += ' AND l.created_at >= $startDate';
    params.$startDate = startDate;
  }
  if (endDate) {
    query += ' AND l.created_at <= $endDate';
    params.$endDate = endDate;
  }
  if (userId) {
    query += ' AND l.user_id = $userId';
    params.$userId = userId;
  }

  query += ' ORDER BY l.created_at DESC';

  const logs = db.query(query).all(params) as any[];

  const csvRows = ['ID,User,Action,Details,Time'];
  logs.forEach(l => {
    csvRows.push([
      l.id,
      `"${l.username || 'Unknown'}"`,
      `"${l.action}"`,
      `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`, // Escape quotes
      l.created_at
    ].join(','));
  });

  return c.text(csvRows.join('\n'), 200, {
    'Content-Type': 'text/csv',
    'Content-Disposition': 'attachment; filename="audit_logs.csv"'
  });
});

export default {
  port: 3000,
  fetch: app.fetch,
};
