# Project Analysis: XIW-BOT Ecosystem

This report provides a deep technical breakdown of the **xiw-bot-app** project. It is designed to be **context-aware** for AI Agents picking up the project.

## 1. Project Specifications & Tech Stack

### A. XIW-BOT-APP (The Runtime)
**Repository**: [https://github.com/madlybong/xiw-bot.git](https://github.com/madlybong/xiw-bot.git)  
**Version**: 1.4.0
**Description**: Single-file distributable WhatsApp Bot Platform (Server + UI).

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime** | **Bun** | `latest` | JavaScript Runtime & Bundler |
| **Backend** | **Hono** | `^4.11.1` | Lightweight Web Framework |
| **Frontend** | **Vue 3** + **Vuetify** | (Standard Theme) | Mission Control UI |
| **Database** | **SQLite** | Native (`bun:sqlite`) | Embedded Persistence |
| **Whatsapp** | **@whiskeysockets/baileys** | `^6.7.9` | Socket-based Protocol Library |
| **Logging** | **Pino** | `^10.1.0` | Structured Logging (Streamed to UI) |


---

## 2. Feature Breakdown: XIW-BOT-APP

### Core Modules

#### 1. Command Center (Dashboard)
- **UI File**: `src/ui/src/pages/Dashboard.vue`
- **Backend**: `src/server/wa.ts`, `src/server/index.ts`
- **Capabilities**:
    - **Instance Management**: Create/Delete SQLite-backed generic sessions.
    - **Resilience**: **Exponential Backoff** (2s, 4s, 8s...) on reconnection prevents IP bans.
    - **Operational Safety**: Displays `last_stop_reason` (e.g., `auth_expired`, `qr_timeout`) and `last_known_error`.
    - **Live Logs (Beta/Paused)**: "Terminal" button opens SSE stream.

#### 2. Access Control & Security
- **UI File**: `src/ui/src/pages/Users.vue`
- **Model**: **Strict Dual-Authentication**.
    - **Humans**: JWT Login (UI Access).
    - **machines**: Static API Tokens (API Only).
- **Capabilities**:
    - **Token Hardening**: Tracks `last_used_at` and `usage_count` for all tokens.
    - **Quota Visibility**: Injects `X-Quota-Used` headers in API responses.

#### 3. Contact Registry
- **UI File**: `src/ui/src/pages/Contacts.vue`
- **Capabilities**: 
    - **Suppression**: Can mark contacts as `suppressed` (Blocklist).
    - **Source Attribution**: Tracks origin (`auto`, `manual`, `import`).

#### 4. Audit Ledger (System of Record)
- **UI File**: `src/ui/src/pages/AuditLog.vue`
- **Backend**: `src/server/audit.ts`
- **Capabilities**: 
    - **Normalized Schema**: Everything logged with `severity` (INFO/WARN/ERROR), `actor_type` (user/api), and `auth_type`.
    - **Traceability**: All critical actions (Sends, Logins, Configs) are immutable.

#### 5. Documentation
- **Capabilities**: 
    - **Doc Awareness**: `GET /api/health` exposes system capabilities and endpoint support.

#### 6. Messaging Policy Engine (MPE)
- **Backend**: `src/server/mpe/`
- **Capabilities (v1.0)**:
    - **Centralized Rules**: Single pipeline for all message sends. No bypasses.
    - **Core Rules**: Instance Assignment, Contact Suppression, Instance Status.
    - **Compliance**: 24h Window Enforcement (Anti-Spam), First-Inbound Unlock.
    - **Content**: Forbidden Words (Regex), Template Validation (Variable Schema).
    - **Media Support**: Text, Image, Video, Audio (PTT), Document, Location.
    - **Templates**: Server-side variable hydration `{{1}}` for approved templates.
    - **Resource**: Quota Enforcement (Daily Limits with Lazy Reset).
    - **Audit**: Blocks are logged with `WARN` severity.

---



## 4. Technical Implementation Details (Context for AI)

### Authentication & Authorization
- **Middleware** (`src/server/auth.ts`):
    - Distinguishes **JWT** (Human) vs **Static Token** (Machine).
    - Blocks Static Tokens from Management APIs (Users/Accounts).
    - Injects Quota Headers (`X-Quota-Used`, `X-Quota-Remaining`) for all.

### WhatsApp Session Management (`src/server/wa.ts`)
- **Storage**: Custom SQLite Adapter (`wa-auth.ts`).
    - **Tables**: `wa_auth_creds` (Session) + `wa_auth_keys` (Granular Keys).
    - **Atomic Writes**: Prevents JSON blob corruption.
- **Resilience**:
    - **Exponential Backoff**: Reconnects with increasing delays (max 60s).
    - **Smart Error Handling**:
        - `401/LoggedOut` -> Stop (Auth Expired).
        - `515/StreamError` -> Immediate Retry.
        - `ConnectionClosed` -> Backoff Retry.
- **Bot Defense**: Uses `Ubuntu/Chrome` User-Agent to mimic desktop traffic.
- **Lifecycle**:
    - **QR Timeout**: Auto-stop after 5 minutes of inactivity.
    - **Graceful Shutdown**: SIGINT/SIGTERM handlers close sockets cleanly.

### Database Schema Updates (v1.3.4)
- **New Tables**: `wa_auth_creds`, `wa_auth_keys` (Granular Auth).
- **instances**: Added `last_stop_reason`, `last_known_error`, `reply_window_enforced`.
- **contacts**: Added `suppressed`, `source`, `last_inbound_at`.
- **api_tokens**: Added `last_used_at`, `usage_count`.
- **audit_logs**: Added `severity`, `actor_type`, `auth_type`.

---

## 5. Public REST API Reference

**Base URL**: `http://localhost:3000`
**Auth**: Bearer Token
**Headers**: Returns `X-Quota-Used`, `X-Quota-Remaining` where applicable.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Login (Returns `token`, `role`, `expiresAt`) |
| `GET` | `/api/health` | System Capabilities |
| `GET` | `/backend/wa/status` | List all instances with status |
| `POST` | `/api/wa/send/text/:id` | Send Message (Checks Suppression) |
| `POST` | `/api/wa/send/image/:id` | Send Image |
| `POST` | `/api/wa/send/video/:id` | Send Video (Supports GIF) |
| `POST` | `/api/wa/send/audio/:id` | Send Audio (Supports PTT/Voice Note) |
| `POST` | `/api/wa/send/document/:id` | Send Document / File |
| `POST` | `/api/wa/send/location/:id` | Send Location Co-ords |
| `POST` | `/api/wa/send/template/:id` | Send Template (Hydrated) |

---

## 6. Development Notes

- **Run Command**: `bun run dev` (Runs Server + UI concurrently).
- **Build**: `bun run build` (Builds UI to `dist`, compiles server to `bot-server.exe` (Windows) or `bot-server`).
- **Config**: `vite.config.ts` has Proxy rules mapping `/api` and `/backend` to `localhost:3000`. Proxy timeouts are disabled for SSE support.

## 7. Deployment Workflow

### Prerequisites
- **Runtime**: Bun (`latest`), Node `20.x` (for compatibility checks).
- **Environment**: Linux (Ubuntu 22.04 LTS recommended) or Windows Server.

### Workflow Steps
1.  **Build**:
    -   Command: `bun run build`
    -   Process:
        1. Compiles Vue UI (`bun run build:ui`) -> `dist/`
        2. Embeds assets into server bundle (`bun run embed`)
        3. Compiles Bun binary (`bun build --compile`) -> `bin/bot-server.exe` (or Linux binary)
    -   Artifacts: `bin/bot-server` (binary)

2.  **Release**:
    -   Updates `package.json` version.
    -   Generates `CHANGELOG.md`.
    -   Tags git commit.

3.  **Deploy**:
    -   Copy `bin/bot-server` to target server.
    -   Ensure `bot-server.sqlite` is in the same directory (or will be created).
    -   Run `./bot-server`.
