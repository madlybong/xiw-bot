# Changelog

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
