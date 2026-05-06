#!/usr/bin/env bash
# Archivist Backend Uninstaller for Linux
set -euo pipefail

INSTALL_DIR="${1:-/opt/archivist/backend}"
SERVICE_NAME="archivist-backend"

echo ""
echo "Archivist Backend Uninstaller"
echo ""

# Stop and remove systemd service
if systemctl list-unit-files | grep -q "$SERVICE_NAME"; then
    echo "Stopping service '$SERVICE_NAME'..."
    sudo systemctl stop "$SERVICE_NAME" 2>/dev/null || true
    sudo systemctl disable "$SERVICE_NAME" 2>/dev/null || true
    sudo rm -f "/etc/systemd/system/${SERVICE_NAME}.service"
    sudo systemctl daemon-reload
    echo "Service removed."
else
    echo "Service '$SERVICE_NAME' not found (already removed)."
fi

# Ask about files
read -rp "Remove installation files at $INSTALL_DIR? (y/n) " answer
if [ "$answer" = "y" ]; then
    sudo rm -rf "$INSTALL_DIR"
    echo "Files removed."
else
    echo "Installation files kept at $INSTALL_DIR"
fi

echo ""
echo "Uninstall complete."
