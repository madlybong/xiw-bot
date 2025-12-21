# XiW Bot Server

A high-performance WhatsApp Bot Server built with **Bun**, **Hono**, and **Vue.js 3 + Vuetify**.
Manage multiple WhatsApp instances, audit logs, and address books from a unified, self-hosted dashboard.

## 🚀 Features

### Core
-   **Multi-Instance Support**: Run multiple WhatsApp accounts simultaneously.
-   **Fast & Lightweight**: Backend powered by Bun + Hono.
-   **Modern UI**: Built with Vue 3, Vuetify, and Material Design (Dark/Light Mode).
-   **Self-Contained**: Compiles to a single executable binary.

### Management
-   **User Roles**: Admin (Full Access) and Agent (Restricted Access) roles.
-   **Usage Limits**: Set message limits (e.g., 1000/day) per agent.
-   **Audit Logs**: Track every action and message sent.
-   **Global Address Book**: Centralized contact management with Import/Export.

### Resilience
-   **Connection Stability**: Hardened Baileys configuration to prevent 428 errors.
-   **Session Reset**: Built-in tools to recover from corrupted sessions.

## 🛠️ Installation

### Quick Start (Binary)
Download the latest release from the [Releases Page](../../releases).

1.  Run the server:
    ```bash
    ./bot-server.exe
    ```
2.  Open `http://localhost:3000` in your browser.
3.  Login with the admin credentials (see below).

### Setup Admin Account
The first time you run the server, you need to create an admin account via CLI:
```bash
./bot-server.exe --admin-user admin --admin-password "secret123"
```

## 💻 Development

### Prerequisites
-   [Bun](https://bun.sh) (latest version)

### Build from Source
1.  **Install Dependencies**:
    ```bash
    bun install
    cd src/ui && bun install && cd ../..
    ```

2.  **Build UI & Server**:
    ```bash
    bun run build
    ```
    This command compiles the Vue frontend, embeds it into the Go binary assets, and compiles the Hono server.

3.  **Run Locally (Dev Mode)**:
    ```bash
    # Terminal 1: Backend
    bun run dev:server

    # Terminal 2: Frontend
    bun run dev:ui
    ```

## 📚 API Documentation
The built-in Swagger/OpenAPI documentation is available at `/docs` (e.g., `http://localhost:3000/docs`).

## 📦 Versioning
This project uses semantic versioning. 
-   **Releases**: Triggered by pushing a tag `vX.Y.Z`.
-   **Current Version**: v0.9.0

## 📄 License
MIT
