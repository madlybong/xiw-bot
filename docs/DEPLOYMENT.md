# Deployment Guide (v1.4.0)

## Prerequisites
-   **Target OS**: Windows (Server 2016+) or Linux (Ubuntu 20.04+).
-   **Runtime**: Bun (for building) or just the binary (for running).
-   **Files Required**:
    -   `bin/bot-server.exe` (Windows) or `bin/bot-server` (Linux) - Generated after build.
    -   `bot-server.sqlite` (Will be created automatically if missing).

## 1. Build
To generate the comprehensive binary from source:
```bash
bun run build
# Output will be in the `/bin` directory:
# - bin/bot-server      (Linux)
# - bin/bot-server.exe  (Windows)
```

## 2. Linux Deployment

### Option A: Automatic Service (Recommended)
This method uses the master `manage-service.sh` script to set up, monitor, and manage the systemd service.

1.  **Prepare Files**:
    Create a folder (e.g., `/opt/xiw-bot`) and copy the **binary** and the **management script** into it.
    *Note: The script expects the binary to be named `bot-server` in the *same* directory.*
    ```bash
    mkdir -p /opt/xiw-bot
    cp bin/bot-server /opt/xiw-bot/
    cp manage-service.sh /opt/xiw-bot/
    cd /opt/xiw-bot
    chmod +x bot-server manage-service.sh
    ```

2.  **Run Manager**:
    Run the script with `sudo` and follow the interactive menu.
    ```bash
    sudo ./manage-service.sh
    ```
    Select **Install** to create and start the `xiwbot` service automatically.
    
    *You can re-run this script later to view **Logs**, check **Status**, or **Uninstall**.*

### Option B: Manual Execution
Simply run the binary in a screen/tmux session or as a background process.
```bash
./bot-server
```

## 3. Windows Deployment

### Service Setup (NSSM)
We recommend using **NSSM** (Non-Sucking Service Manager) to run the bot as a background service.

1.  **Prepare**:
    -   Create `C:\xiw-bot\`
    -   Copy `bin\bot-server.exe` to this folder.
2.  **Install Service**:
    -   Download NSSM.
    -   Run: `nssm install XiWBot "C:\xiw-bot\bot-server.exe"`
    -   Run: `nssm start XiWBot`

## 4. Initial Configuration
On the very first run (if no users exist), you can initialize the Admin account via CLI arguments:
```bash
./bot-server --admin-user "admin" --admin-password "Start123!"
```
*Alternatively, you can manually insert into the SQLite DB if preferred.*

## Troubleshooting
-   **"Port 3000 in use"**: Set `SERVER_PORT=3001` environment variable.
-   **"Database Locked"**: Ensure only one instance of `bot-server` is running.
-   **"Permission Denied"**: Ensure `chmod +x bot-server` was run on Linux.
