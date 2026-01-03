# Changelog

## [1.4.0] - 2026-01-03

### Refactor (Architecture)
- **Monorepo Migration**: Merged `src/ui` into root package. Removed nested `package.json` for a unified `node_modules` structure and simpler build process.
- **Project Structure**: Moved specific scripts to `root/scripts` for better organization.
- **Build System**: Introduced `build.sh` for consistent cross-platform builds (handles Git Bash, WSL, Linux).

### Added
- **Auto-Resume**: Server now automatically detects and resumes sessions that were active prior to shutdown/restart.
- **Robust Error Handling**: Wrapped all messaging APIs with `try/catch` to prevent server crashes on socket timeouts (returns 408/500 instead of exiting).
- **JID Sanitization**: All endpoints now sanitize phone numbers before sending to prevent malformed queries.

### Changed
- **Documentation**: Updated `API.md` and `DEPLOYMENT.md` to reflect current paths and simplified deployment (no license key required).
- **CI**: Updated GitHub Workflow to use the new unified dependency structure.

## [1.3.5] - 2026-01-02

### Fixed
- **UI**: Added global fetch interceptor to automatically logout users when the session token expires (401/403).
- **UI**: Fixed a regression in version display in the navigation drawer.

## [1.3.4] - 2026-01-01

### Security & Reliability (Hardening)
- **WhatsApp Auth**: Migrated from single JSON blob to granular SQL tables (`wa_auth_creds`, `wa_auth_keys`) for atomic, crash-proof session storage.
- **Resilience**: Implemented Exponential Backoff for reconnection logic (prevents IP bans during outages).
- **Process Lifecycle**: Added Graceful Shutdown (SIGTERM/SIGINT) to close sessions cleanly.
- **Bot Defense**: Updated Browser Fingerprint to standard Linux/Chrome to reduce ban rate.
- **Logic**: Intelligent handling of disconnect reasons (re-QR on 401, retry on 515).

## [1.3.3] - 2025-12-27

### Added
- **Release Engineering**: Hardened build pipeline (Mandatory UI rebuilds).
- **Features**: UI/Backend version sanity check with mismatch warning.
- **Automation**: One-command release helper (`bun run release`).
- **CI**: Bulletproof GitHub Actions workflow for consistent binary builds.

## [1.3.2] - 2025-12-27

### Added
- **UI**: Added per-instance Settings Panel in Dashboard.
- **UI**: Exposed toggle for 24-hour reply window enforcement.
- **UI**: Displayed operational metadata (Status, JID, ID) in settings.

## [1.3.1] - 2025-12-27

### Added
- **Features**:
    - **Optional 24-hour Reply Window**: Per-instance configuration flag (`reply_window_enforced`) to toggle MPE enforcement. Defaults to `true` (Enforced).
    - **Dashboard**: Added Instance ID display with copy-to-clipboard button.
    - **Database**: Implemented safe migration system (`schema_meta`) for reliable upgrades.

### Changed
- **API**: Added `PATCH /backend/instances/:id` for instance configuration.
- **MPE**: `checkWindow` rule now respects instance configuration.

## [1.3.0] - 2025-12-27

### Removed
- **Licensing System**: Completely removed all licensing restrictions.
    - Application now runs **unrestricted** by default.
    - Removed `License.vue` and `/license` route.
    - Removed `checkLicense` rule from MPE pipeline.
    - Removed `public.key` dependency from build process.
    - Removed `XIW-LIC-GEN` integration.

### Changed
- **API**: Removed `/api/license` endpoint.
- **API**: `/api/health` no longer reports `license_mode` or limits (defaults to unrestricted).
- **Navigation**: Removed "License" menu item.

## [1.2.0] - 2025-12-27

### Added
- **Messaging Policy Engine (MPE)**: Centralized message evaluation pipeline.
    - **Control Rules**: License checks, Instance Assignment, Instance Health.
    - **Compliance**: 24h Marketing Window enforcement with "First-Inbound" unlock.
    - **Content Policy**: Regex-based forbidden content filtering.
    - **Templates**: Template validation (existence & schema) and exemption from 24h window.
    - **Quotas**: Daily message frequency limits with lazy-reset logic.
- **Enterprise UI Theme**:
    - Complete visual overhaul using "Enterprise Dark" & "Cool Light" palettes.
    - Typography update: Poppins (Primary) & JetBrains Mono (Code).
    - Compact component density for operations focus.
- **Templates API**: New `POST /api/wa/send/template/:id` endpoint.

### Changed
- **Database**:
    - Added `templates` table.
    - Added `last_inbound_at` to `contacts`.
    - Added `suppressed` to `contacts`.
    - Added `message_limit`, `limit_frequency`, `message_usage` to `users`.
- **Logging**: Improved SSE reliability with line-buffering in `wa.ts`.

### Fixed
- Fixed Bun SQLite linting errors with query bindings.
- Fixed JSON parsing errors in live log streams.
