# Deployment Guide

## Prerequisites
-   **Target OS**: Windows (Server 2016+) or Linux (Ubuntu 20.04+).
-   **Files Required**:
    -   `bot-server.exe` (from `bin/`)
    -   `public.key` (MUST be in the same folder as the .exe)

## 1. Prepare Release
Run the build command to generate the binary and copy the public key:
```bash
bun run build
```
This creates/updates the `bin` folder with `bot-server.exe` and `public.key`.

## 2. Server Setup (First Time)
1.  **Copy Files**: Transfer the entire content of the `bin` folder to the server (e.g., `C:\xiw-bot\`).
2.  **Generate License**:
    On your dev machine, generate a license for the client:
    ```bash
    bun run scripts/gen-license.ts --client="Client Name" --expires="2025-12-31" --wa=5 --agents=2
    ```
3.  **Set Environment Variable**:
    You must set `XIWBOT_LICENSE` before running the bot.

    **Windows (PowerShell)**:
    ```powershell
    $env:XIWBOT_LICENSE = "XIWBOT.eyJ..."
    .\bot-server.exe
    ```

    **Windows (CMD)**:
    ```cmd
    set XIWBOT_LICENSE=XIWBOT.eyJ...
    bot-server.exe
    ```

    **Linux**:
    ```bash
    XIWBOT_LICENSE="XIWBOT.eyJ..." ./bot-server
    ```

## 3. Persistent Deployment (Recommended)

Since version 1.0.0, the release package includes automated scripts for service management.

### Windows Service
1.  Open the distributed `dist` folder.
2.  Right-click `install_service.bat` and select **Run as Administrator**.
3.  The script will verify admin rights, install the service, and start it.
4.  Check status: `sc query XiWBot_<clientname>`

### Linux (Systemd)
1.  Upload the `dist` folder to the server.
2.  Set executable permissions:
    ```bash
    chmod +x *.sh *.exe
    ```
3.  Run the installer:
    ```bash
    sudo ./install_service.sh
    ```
4.  The script will check for root, create a systemd unit, and start the service.
5.  Check status: `sudo systemctl status <service_name>`

## Troubleshooting
-   **"Public key not found"**: Ensure `public.key` is in the same directory as the executable.
-   **"License expired"**: Generate a new license with a future date and update the environment variable.
-   **"Machine Mismatch"**: The license was bound to a different machine. Generate a new license for the new server (machine binding is soft, so it likely won't crash, but will show warnings).
