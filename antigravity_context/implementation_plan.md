# Implementation Plan - BunJS Bot Server

The goal is to create a generic "Unofficial Bot Server" with multi-account support, SQLite storage, and a Management UI, distributable as a single executable.

## User Review Required
> [!IMPORTANT]
> **Single File Distribution**: To achieve a *true* single-file executable (no accompanying `public` folder), I will implement a build step that reads the compiled Frontend assets (HTML/JS/CSS) and embeds them directly into the Server code (as a TypeScript map/object) before compilation. This ensures `bot-server.exe` is the only file needed.

## Proposed Changes

### Structure
- Root
    - `src/`
        - `server/`: Bun + Hono backend
        - `ui/`: React + Vite frontend
        - `scripts/`: Build scripts (asset embedding)
    - `package.json`: Monorepo-ish structure or just root dependencies

### 1. Frontend (UI)
**Location**: `src/ui`
- Stack: Vite + React + Vanilla CSS (Premium Look)
- Features:
    - **Login Page**: JWT Login.
    - **Dashboard**:
        - List Accounts (Bots/Users).
        - Add Account (Modal).
        - Status indicators.

### 2. Backend (Server)
**Location**: `src/server`
- Stack: Bun + Hono + `bun:sqlite`
- **Database**: SQLite with tables:
    - `users` (Admin access)
    - `instances` (The "bots" or accounts being managed)
    - `kv_store` (Generic configuration)
- **API**:
    - `POST /api/auth/login`: Returns JWT.
    - `GET /api/accounts`: List accounts (Auth required).
    - `POST /api/accounts`: Create account.
    - `DELETE /api/accounts/:id`: Remove.
    - Middleware to intercept non-API requests and serve from the **Embedded Asset Map** (see below).

### 4. Database Schema Updates
- **`users` Table**:
    - `id`, `username`, `password` (Argon2 or bcrypt), `role` ('admin', 'agent'), `created_at`.
- **`api_tokens` Table**:
    - `id`, `user_id`, `name`, `token` (hashed), `last_used_at`.
- **`whatsapp_sessions` Table**:
    - `id`, `session_id`, `data` (JSON), `status` (connecting, connected, disconnected).

### 5. WhatsApp Integration (Baileys)
- Use `@whiskeysockets/baileys` for lightweight, socket-based connection (no Puppeteer needed).
- **Session Handling**: Store auth credentials in SQLite (using a custom AuthState adapter).
- **QR Code**: Stream QR code to UI via API (SSE or polling).

## Verification Plan

### Automated Tests
- **API Tests**: User creation, Token generation.

### Manual Verification
1.  **User Roles**: Login as Admin (create agent), Login as Agent (verify restricted access).
2.  **WhatsApp**:
    - Start new session -> Scan QR -> Send test message.
    - Restart server -> Verify session persists.
3.  **API Tokens**: Generate token -> Use in `curl` request -> Verify success.

### 3. Build Pipeline (The "Single File" Magic)
1. **Build UI**: `cd src/ui && npm run build` (outputs to `src/ui/dist`).
2. **Embed Assets**: Custom Bun script `embed-assets.ts`:
    - Reads all files in `src/ui/dist`.
    - Generates `src/server/assets.gen.ts` exporting a `Map<string, Uint8Array>` of filenames to content.
3. **Compile Server**: `bun build --compile src/server/index.ts --outfile bin/bot-server`.

## Verification Plan

### Automated Tests
- **API Tests**: use `bun:test` to test API endpoints (`/login`, `/accounts`).
- **Build Test**: Run the build script and verify `bin/bot-server.exe` exists and is executable.

### Manual Verification
1. **Start Server**: Run the compiled executable `./bin/bot-server`.
2. **UI Check**: Open `http://localhost:3000`.
    - Verify UI loads (means asset embedding worked).
    - Login with default credentials (admin/admin).
3. **Persistance Check**: Restart server, ensure data remains (SQLite).
