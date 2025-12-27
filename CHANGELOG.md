# Changelog

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
