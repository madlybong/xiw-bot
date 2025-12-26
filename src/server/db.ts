import { Database } from 'bun:sqlite';

const db = new Database('bot-server.sqlite');

// Optimize for concurrency
db.run('PRAGMA journal_mode = WAL;');

// Initialize Schema
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'agent',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS api_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assigned_user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    last_used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(assigned_user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS token_instances (
    token_id INTEGER NOT NULL,
    instance_id INTEGER NOT NULL,
    PRIMARY KEY (token_id, instance_id),
    FOREIGN KEY(token_id) REFERENCES api_tokens(id) ON DELETE CASCADE,
    FOREIGN KEY(instance_id) REFERENCES instances(id) ON DELETE CASCADE
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id TEXT PRIMARY KEY,
    data JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS instances(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  config TEXT,
  status TEXT DEFAULT 'stopped',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

console.log('Database initialized');

// Initialize Audit Logs
db.run(`
  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    instance_id INTEGER,
    action TEXT NOT NULL,
    details JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// View: Audit Log View specifically
/*
  We might want a View in UI, but the requirement specifically asked for Export first.
  "API endpoint to export audit_logs to CSV, with filtering by date and user"
*/

db.run(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    tags TEXT,
    notes TEXT,
    source TEXT DEFAULT 'manual', 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: Add columns to users table safely
const columnsToAdd = [
  'ALTER TABLE users ADD COLUMN message_limit INTEGER DEFAULT 1000',
  'ALTER TABLE users ADD COLUMN limit_frequency TEXT DEFAULT "daily"',
  'ALTER TABLE users ADD COLUMN message_usage INTEGER DEFAULT 0',
  'ALTER TABLE users ADD COLUMN last_usage_reset DATETIME DEFAULT CURRENT_TIMESTAMP',
  'ALTER TABLE users ADD COLUMN status TEXT DEFAULT "active"'
];

for (const query of columnsToAdd) {
  try {
    db.run(query);
  } catch (e) {
    // Ignore "duplicate column name" error
  }
}

// Ensure unique admin
try {
  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_one_admin ON users(role) WHERE role = 'admin'`);
} catch (e) { }

// Seed Default Admin
try {
  const userCount = (db.query('SELECT COUNT(*) as count FROM users').get() as any).count;
  if (userCount === 0) {
    console.log('[DB] Seeding default admin account...');
    const adminHash = Bun.hash('admin').toString();
    db.run('INSERT INTO users (username, password_hash, role, message_limit, limit_frequency, status) VALUES ($u, $p, $r, -1, "unlimited", "active")', {
      $u: 'admin',
      $p: adminHash,
      $r: 'admin'
    });
    console.log('[DB] Default admin created: admin / admin');
  }
} catch (e) {
  console.error('[DB] Failed to seed admin:', e);
}

export default db;
