# Deployment Guide

## Prerequisites
-   **Target OS**: Windows (Server 2016+) or Linux (Ubuntu 20.04+).
-   **Files Required**:
    -   `bot-server.exe` (Windows) or `bot-server` (Linux) - Found in `bin/` after build.
    -   `bot-server.sqlite` (Will be created automatically if missing).

## 1. Prepare Release
Run the build command to generate the binary:
```bash
bun run build
// Output: bin/bot-server (and .exe)
```

## 2. Server Setup
1.  **Transfer Files**: Copy the `bot-server` binary to your server (e.g., `C:\xiw-bot\` or `/opt/xiw-bot/`).
2.  **Initialize Admin User**:
    run the binary with admin flags to create your initial admin account:
    
    **Windows (PowerShell)**:
    ```powershell
    .\bot-server.exe --admin-user "admin" --admin-password "Start123!"
    ```

    **Linux**:
    ```bash
    ./bot-server --admin-user "admin" --admin-password "Start123!"
    ```
    *This creates the user in the SQLite DB and exits.*

3.  **Run the Server**:
    Simply run the binary to start the server.
    ```bash
    ./bot-server
    ```
    *Server listens on port 3000 by default (set `SERVER_PORT` env var to change).*

## 3. Persistent Deployment (Recommended)

### Windows Service
Use a tool like **NSSM** (Non-Sucking Service Manager) or creating a scheduled task.
1.  Download NSSM.
2.  `nssm install XiWBot "C:\xiw-bot\bot-server.exe"`
3.  `nssm start XiWBot`

### Linux (Systemd)
Create a unit file `/etc/systemd/system/xiw-bot.service`:
```ini
[Unit]
Description=XiW Bot Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/xiw-bot
ExecStart=/opt/xiw-bot/bot-server
Restart=always

[Install]
WantedBy=multi-user.target
```
Then enable and start:
```bash
sudo systemctl enable xiw-bot
sudo systemctl start xiw-bot
```

## Troubleshooting
-   **"Port in use"**: Check if another process is using port 3000.
-   **"Database Locked"**: Ensure only one instance of the server is accessing the sqlite file.

