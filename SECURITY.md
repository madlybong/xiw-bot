# Security Policy

## 🛡️ Reporting a Vulnerability

If you discover a security vulnerability within XIW-BOT, please report it privately.

**DO NOT** open a public GitHub Issue for sensitive security vulnerabilities.

### Reporting Process
1.  Email the maintainers (if a contact is listed in profile) or use GitHub Security Advisories if enabled.
2.  Provide a proof-of-concept or detailed description of the vulnerability.
3.  We will attempt to review the report on a **best-effort basis**.

## ⚠️ Important Disclaimers

-   **Self-Hosted Responsibility**: This is a self-hosted tool. You are responsible for the security of the server, network, and environment where you deploy it.
-   **No Guaranteed Response**: This project is maintained by volunteers. We do not guarantee a specific response time or a fix timeline.
-   **No Bug Bounties**: This project is a free open-source effort. We do not offer financial rewards for vulnerability reports.

## 🔒 Best Practices

-   Run XIW-BOT behind a reverse proxy (Nginx/Caddy) with SSL/TLS.
-   Do not expose the server directly to the public internet without authentication handling.
-   Regularly update your instance to the latest release.
