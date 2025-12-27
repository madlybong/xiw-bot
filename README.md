# XIW-BOT

## Project Overview

XIW-BOT is a high-performance WhatsApp Bot Server built with **Bun**, **Hono**, and **Vue.js 3 + Vuetify**.
Manage multiple WhatsApp instances, audit logs, and address books from a unified, self-hosted dashboard.

## Important Notice / Disclaimer

> **⚠️ RESEARCH & DEVELOPMENT TOOL ONLY**
>
> This project is a reverse-engineering effort to explore the WhatsApp Web protocol. It is NOT affiliated with, authorized by, or endorsed by WhatsApp Inc. or Meta Platforms, Inc.
>
> **USE AT YOUR OWN RISK.** Automated use of WhatsApp may violate their Terms of Service and could result in the permanent banning of your account. The authors accept no responsibility for banned accounts, lost data, or legal consequences.

---

## 📖 What This Project Is

XIW-BOT is an open-source technical platform designed for developers and system administrators who wish to run their own WhatsApp automation infrastructure. It provides a monolithic "Server + UI" binary that bridges the `Baileys` library (protocol adapter) with a modern Vue 3 control panel.

-   **Technical Platform**: A raw, unopinionated wrapper around the WhatsApp Web Socket protocol.
-   **Self-Hosted**: You run the binary. You own the data. You manage the network.
-   **Developer-Focused**: Exposes low-level APIs and events for custom integration.

## 🚫 What This Project Is NOT

-   It is **NOT** a SaaS service.
-   It is **NOT** a "Safe" or "White-Hat" marketing tool.
-   It does **NOT** guarantee anti-ban protection.
-   It does **NOT** come with support, SLA, or warranties.

---

## ⚡ Core Features

-   **Multi-Instance Runtime**: Manage multiple distinct WhatsApp sessions from one process.
-   **Messaging Policy Engine (MPE)**: A configurable logic layer to enforce your own internal rules (e.g., rate limits, content filtering).
-   **Audit Logging**: Local SQLite-based logging of all system actions.
-   **Restricted API**: Token-based access control for programmatic integration.
-   **Operations Console**: A minimal, dark-mode UI for monitoring status and managing configurations.

---

## 🏗️ Architecture Overview

The system runs as a single compiled executable (Bun runtime + Hono Server + Vue UI).

1.  **Protocol Layer**: Uses `@whiskeysockets/baileys` to communicate with WhatsApp servers.
2.  **Logic Layer**: `src/server/mpe` strictly evaluates every outgoing message against defined policies.
3.  **Persistence**: `bun:sqlite` stores local state (sessions, logs, users) in `bot-server.sqlite`.
4.  **Interface**: A bundled Vue 3 SPA served directly by the Hono backend.

---

## Installation & Running

**Prerequisites**:
-   A supported OS (Linux x64, Windows x64)
-   Basic understanding of command-line tools

**Running from Binary**:

1.  Download the latest release.
2.  Run the executable:
    ```bash
    ./bot-server
    ```
3.  Access the console at `http://localhost:3000`.
4.  First run will initialize the local SQLite database.

**Running from Source**:

```bash
# Install dependencies
bun install

# Run development mode
bun run dev -- concurrent
```

---

## 🛡️ Security & Responsibility

This software provides **mechanisms**, not **policies**. It is the sole responsibility of the operator to ensure their usage complies with:
1.  WhatsApp / Meta Terms of Service.
2.  Local laws regarding automated messaging and privacy (e.g., GDPR, CAN-SPAM).
3.  Ethical standards for communication.

The software is provided "as-is". No security audits have been performed. usage in public-facing or hostility environments is not recommended without additional layers of security (VPN, Firewall, Reverse Proxy).

---

## ⚖️ Open Source License

This project is licensed under the **MIT License**.

-   You are free to use, modify, and distribute this software.
-   You assume full liability for any outcomes.
-   There is NO WARRANTY of any kind.

See the [LICENSE](LICENSE) file for the full legal text.

---

## 🤝 Support & Contributions

-   **No Commercial Support**: This project is maintained by volunteers. Do not expect commercial-grade support or response times.
-   **Issues**: Please report technical bugs on GitHub. Feature requests or "how-to" questions regarding ban avoidance will be closed.
-   **Contributions**: Pull Requests are welcome (See `CONTRIBUTING.md` if available).

---

## Ethical Use Statement

XIW-BOT is designed for legitimate operations management, such as:
-   Customer Support Helpdesks
-   Internal System Notifications
-   Personal Home Automation
-   Research & Protocol Analysis

**We condemn the use of this software for:**
-   Spamming or Bulk Marketing
-   Harassment or Cyberbullying
-   Misinformation Campaigns

Users found utilizing this software for malicious purposes will be blocked from the open-source community support channels.

## 🛑 Final Disclaimer

**By downloading, compiling, or running this software, you acknowledge that you understand the risks involved in automating WhatsApp and agree to hold the authors and contributors harmless from any damages or liabilities.**
