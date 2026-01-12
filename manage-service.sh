#!/bin/bash

# Script: manage-service.sh
# Description: Master script to manage the XiW Bot service.
#              Handles Install, Status, Uninstall, and Logs.
#              Run this script from the app directory.
#              For Install/Uninstall, run with sudo if necessary.

# Constants
SERVICE_NAME="xiwbot"
EXE_NAME="bot-server"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXEC_PATH="$APP_DIR/$EXE_NAME"

# Detect User/Group from the directory itself to ensure compatibility
USER_NAME=$(stat -c '%U' "$APP_DIR")
GROUP_NAME=$(stat -c '%G' "$APP_DIR")

# Color codes for pretty output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if script is run as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}Error: This action requires root privileges. Please run with sudo.${NC}"
        exit 1
    fi
}

# Function to display header
show_header() {
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}   XiW Bot Service Manager${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
}

# Function to install the service
install_service() {
    check_root
    echo -e "${YELLOW}Starting installation process...${NC}"
    echo ""

    # Step 1: Verify executable exists
    if [ ! -f "$EXEC_PATH" ]; then
        echo -e "${RED}Error: Executable '$EXE_NAME' not found in $APP_DIR.${NC}"
        exit 1
    fi

    # Step 2: Permission modifications
    echo -e "${YELLOW}Modifying permissions...${NC}"
    chown -R $USER_NAME:$GROUP_NAME "$APP_DIR"
    chmod +x "$EXEC_PATH"
    echo -e "${GREEN}Permissions updated: Directory owned by $USER_NAME, executable set.${NC}"

    # Step 3: Verify permissions
    echo -e "${YELLOW}Verifying permissions...${NC}"
    if [ "$(stat -c '%U' "$EXEC_PATH")" != "$USER_NAME" ]; then
        echo -e "${RED}Error: Ownership verification failed for $EXEC_PATH.${NC}"
        exit 1
    fi
    if [ ! -x "$EXEC_PATH" ]; then
        echo -e "${RED}Error: $EXEC_PATH is not executable.${NC}"
        exit 1
    fi
    echo -e "${GREEN}Permissions verified successfully.${NC}"

    # Step 4: Create systemd service file
    echo -e "${YELLOW}Creating systemd service file...${NC}"
    cat <<EOF > /etc/systemd/system/$SERVICE_NAME.service
[Unit]
Description=XiW Bot Instance for Tdr Software
After=network.target

[Service]
Type=simple
User=$USER_NAME
Group=$GROUP_NAME
WorkingDirectory=$APP_DIR
ExecStart=$EXEC_PATH
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    echo -e "${GREEN}Service file created at /etc/systemd/system/$SERVICE_NAME.service.${NC}"

    # Step 5: Reload, enable, and start service
    echo -e "${YELLOW}Reloading systemd and starting service...${NC}"
    systemctl daemon-reload
    systemctl enable $SERVICE_NAME
    systemctl start $SERVICE_NAME

    # Step 6: Check if service started successfully
    if systemctl is-active --quiet $SERVICE_NAME; then
        echo -e "${GREEN}Service installed and started successfully!${NC}"
    else
        echo -e "${RED}Error: Service failed to start. Check logs with 'sudo journalctl -u $SERVICE_NAME'.${NC}"
        exit 1
    fi

    echo ""
    echo -e "${BLUE}--------------------------------------------------${NC}"
    echo -e "${GREEN}Installation complete!${NC}"
    echo -e "Check status: sudo systemctl status $SERVICE_NAME"
    echo -e "View logs:    sudo journalctl -u $SERVICE_NAME -f"
    echo -e "${BLUE}--------------------------------------------------${NC}"
}

# Function to uninstall the service
uninstall_service() {
    check_root
    echo -e "${YELLOW}Starting uninstallation process...${NC}"
    echo ""

    # Stop and disable service
    echo -e "${YELLOW}Stopping and disabling service...${NC}"
    systemctl stop $SERVICE_NAME || true
    systemctl disable $SERVICE_NAME || true

    # Remove service file
    echo -e "${YELLOW}Removing service file...${NC}"
    rm -f /etc/systemd/system/$SERVICE_NAME.service

    # Reload systemd
    systemctl daemon-reload

    echo -e "${GREEN}Service uninstalled successfully. No files were deleted.${NC}"
    echo ""
}

# Function to show status
show_status() {
    echo -e "${YELLOW}Fetching service status...${NC}"
    echo ""
    systemctl status $SERVICE_NAME || echo -e "${RED}Service not found or not running.${NC}"
}

# Function to show logs
show_logs() {
    echo -e "${YELLOW}Fetching service logs (press Ctrl+C to exit)...${NC}"
    echo ""
    journalctl -u $SERVICE_NAME -f
}

# Main script logic
show_header
echo -e "Available actions:"
echo -e "  ${GREEN}Install${NC}   - Install and start the service"
echo -e "  ${GREEN}Status${NC}    - Show service status"
echo -e "  ${GREEN}Uninstall${NC} - Stop and remove the service"
echo -e "  ${GREEN}Logs${NC}      - View real-time logs"
echo ""

# Prompt user for action
read -p "Enter your choice (Install/Status/Uninstall/Logs): " ACTION
ACTION=$(echo "$ACTION" | tr '[:upper:]' '[:lower:]')  # Normalize to lowercase

case "$ACTION" in
    install)
        install_service
        ;;
    status)
        show_status
        ;;
    uninstall)
        uninstall_service
        ;;
    logs)
        show_logs
        ;;
    *)
        echo -e "${RED}Invalid choice. Please select Install, Status, Uninstall, or Logs.${NC}"
        exit 1
        ;;
esac