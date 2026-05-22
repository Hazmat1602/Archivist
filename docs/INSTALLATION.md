# Installation Guide

This guide covers every way to install and deploy the Archivist records management system. Choose the path that matches your environment.

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Option A: Windows Installer (Recommended for Production)](#option-a-windows-installer-recommended-for-production)
- [Option B: Linux Script Install](#option-b-linux-script-install)
- [Option C: Developer Setup (From Source)](#option-c-developer-setup-from-source)
- [Frontend Desktop App (Tauri)](#frontend-desktop-app-tauri)
- [Frontend Web Deploy](#frontend-web-deploy)
- [Post-Installation Checklist](#post-installation-checklist)
- [Troubleshooting](#troubleshooting)

---

## Overview

Archivist has two components:

| Component | Description | Where to run |
|-----------|-------------|--------------|
| **Backend** | FastAPI REST API + SQL Server database | On the server hosting (or adjacent to) SQL Server |
| **Frontend** | React web app **or** Tauri desktop app | On each user's workstation (desktop) or served from a web server |

A typical deployment looks like:

```
┌────────────────────────┐       ┌───────────────────┐
│  Server                │       │  User Workstation  │
│  ┌──────────────────┐  │       │                    │
│  │ SQL Server DB     │  │       │  Archivist Desktop │
│  └──────────────────┘  │ HTTP  │  App (Tauri)       │
│  ┌──────────────────┐  │◄─────►│        — or —      │
│  │ Archivist Backend │  │       │  Web browser       │
│  │ (port 8000)       │  │       │  → frontend URL    │
│  └──────────────────┘  │       └───────────────────┘
└────────────────────────┘
```

---

## Prerequisites

### SQL Server

Archivist requires a Microsoft SQL Server database. Any of the following editions work:

- SQL Server 2017 or later (Express, Standard, Enterprise)
- Azure SQL Database

Create a database named `Archivist` (or your preferred name) before installation. The backend will automatically create all required tables on first start.

### ODBC Driver

The backend connects to SQL Server through ODBC. **ODBC Driver 18 for SQL Server** must be installed on the machine running the backend.

**Windows** — Usually already present if SQL Server or SSMS is installed. Otherwise [download it from Microsoft](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server).

**Ubuntu / Debian:**

```bash
curl https://packages.microsoft.com/keys/microsoft.asc | sudo tee /etc/apt/trusted.gpg.d/microsoft.asc
curl https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/prod.list \
  | sudo tee /etc/apt/sources.list.d/mssql-release.list
sudo apt-get update && sudo ACCEPT_EULA=Y apt-get install -y msodbcsql18 unixodbc-dev
```

---

## Option A: Windows Installer (Recommended for Production)

The `.exe` installer is the easiest way to deploy the backend on a Windows server. It bundles an embedded Python runtime, WinSW, and all backend code — no pre-installed dependencies required on the target server.

### Building the Installer

> Only required once, on a build machine — not on the target server.

**Requirements:** [Inno Setup 6](https://jrsoftware.org/isdl.php), PowerShell 5.1+, and internet access.

```powershell
cd installers\backend
.\build_installer.ps1
```

The compiled installer is created at `installers\backend\output\ArchivistBackendSetup.exe`.

Optional build flags:

```powershell
.\build_installer.ps1 -PythonVersion "3.12.7"
.\build_installer.ps1 -WinswVersion "2.12.0"
```

### Running the Installer

Transfer `ArchivistBackendSetup.exe` to the target server and run it. The wizard walks through five steps:

1. **Install directory** — Default: `C:\Program Files\Archivist\Backend`
2. **Database configuration** — SQL Server hostname, database name, username, and password
3. **Advanced database settings** — ODBC driver name, encryption, and certificate trust (the defaults work for most setups)
4. **Service configuration** — API port (default `8000`) and session timeout (minutes)
5. **Install** — Copies files, installs Python dependencies, registers the `ArchivistBackend` Windows service, opens the firewall port, and starts the service

### What the Installer Does

- Copies the backend app and an embedded Python runtime to the install directory
- Generates a `.env` configuration file from the wizard inputs
- Installs all Python dependencies via pip
- Registers `ArchivistBackend` as a Windows service using [WinSW](https://github.com/winsw/winsw)
- Configures automatic service restart and log rotation
- Adds a Windows Firewall inbound rule for the API port

### Managing the Service

```powershell
# Check status
Get-Service ArchivistBackend

# Restart
& "C:\Program Files\Archivist\Backend\service\ArchivistBackend.exe" restart

# Stop
& "C:\Program Files\Archivist\Backend\service\ArchivistBackend.exe" stop
```

### Uninstalling

Use **Add/Remove Programs** in Windows Settings. The uninstaller stops and removes the Windows service and firewall rule automatically.

---

## Option B: Linux Script Install

An interactive Bash script installs the backend and registers it as a systemd service.

### Steps

```bash
cd installers/backend
sudo bash install.sh              # installs to /opt/archivist/backend by default
# — or —
sudo bash install.sh /your/path   # custom install directory
```

The script will:

1. Verify Python 3.11+ and the ODBC driver are installed
2. Prompt for database connection details
3. Copy backend files and create a virtual environment
4. Install Python dependencies
5. Generate a `.env` configuration file
6. Create and enable a systemd service (`archivist-backend`)

### Managing the Service

```bash
sudo systemctl status archivist-backend
sudo systemctl restart archivist-backend
sudo systemctl stop archivist-backend
journalctl -u archivist-backend -f    # view live logs
```

### Uninstalling

```bash
cd installers/backend
sudo bash uninstall.sh
```

---

## Option C: Developer Setup (From Source)

Use this approach for local development or if you want full control over the deployment.

### Backend

**Requirements:** Python 3.11+, [Poetry](https://python-poetry.org/docs/#installation), ODBC Driver 18 (see [Prerequisites](#prerequisites)).

```bash
cd archivist-backend
cp .env.example .env   # then edit .env with your SQL Server credentials (see table below)
poetry install
poetry run uvicorn app.main:app --reload
```

The API is now available at `http://localhost:8000`. Interactive API docs are at `http://localhost:8000/docs`.

### Frontend

**Requirements:** Node.js 20+, npm 10+.

```bash
cd archivist-frontend
npm install
npm run dev
```

The frontend is now available at `http://localhost:5173`. It connects to `http://localhost:8000` by default.

To point the frontend at a different backend URL, create `archivist-frontend/.env`:

```
VITE_API_URL=http://your-backend-host:8000
```

### Makefile Shortcuts

A root `Makefile` wraps common commands:

```bash
make install        # install backend + frontend dependencies
make dev-backend    # run FastAPI with auto-reload
make dev-frontend   # run Vite dev server
make lint           # run frontend ESLint + backend compile check
make build          # build frontend production assets
```

### Backend Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_SERVER` | `localhost` | SQL Server hostname |
| `DB_NAME` | `Archivist` | Database name |
| `DB_USERNAME` | `sa` | SQL Server login |
| `DB_PASSWORD` | *(empty)* | SQL Server password |
| `DB_DRIVER` | `ODBC Driver 18 for SQL Server` | ODBC driver name |
| `DB_ENCRYPT` | `Optional` | Connection encryption mode |
| `DB_TRUST_CERT` | `Yes` | Trust the server certificate |
| `JWT_SECRET_KEY` | `archivist-dev-secret-change-in-production` | JWT signing secret — **change this in production** |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | Session timeout in minutes |

---

## Frontend Desktop App (Tauri)

The frontend can be packaged as a native desktop application using [Tauri](https://tauri.app). This is the recommended way to distribute the frontend to end users who do not use a web browser.

### Building

**Requirements:** [Rust](https://rustup.rs/) and platform build tools ([see Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)).

```bash
cd archivist-frontend
npm install
npm run tauri build
```

This produces platform-specific installers in `archivist-frontend/src-tauri/target/release/bundle/`:

| Platform | Output |
|----------|--------|
| Windows | `.exe` (NSIS installer) |
| Linux | AppImage, `.deb` |
| macOS | `.dmg` |

### Development Mode

```bash
cd archivist-frontend
npm run tauri dev    # launches Tauri with Vite hot-reload
```

### First Launch

When a user opens the Tauri desktop app for the first time, a **Server Setup** screen appears. The user enters:

- **Server address** — the hostname or IP of the machine running the backend (e.g. `192.168.1.100`)
- **Port** — default `8000`
- **HTTPS** — enable if the backend is behind a TLS proxy

After clicking **Test Connection** and confirming it succeeds, the user clicks **Connect** and is taken to the login screen.

---

## Frontend Web Deploy

If you prefer to serve the frontend from a web server instead of using the desktop app:

```bash
cd archivist-frontend
npm install
npm run build
```

The built files are output to `archivist-frontend/dist/`. Serve this directory with any static file server (Nginx, Apache, Caddy, S3 + CloudFront, etc.).

Set the `VITE_API_URL` environment variable **before** building to point the frontend at your backend:

```bash
VITE_API_URL=https://archivist-api.company.local npm run build
```

---

## Post-Installation Checklist

After installation, verify everything is working:

1. **Backend health check** — Open `http://<server>:8000/health` in a browser. You should see `{"status":"ok"}`.
2. **API docs** — Open `http://<server>:8000/docs` to browse the interactive API documentation.
3. **Default admin account** — The backend automatically creates an admin user on first start:
   - Username: `admin`
   - Password: `admin`
4. **Log in** — Open the frontend and sign in with the default admin credentials.
5. **Change the default password** — Go to **Settings** or use the admin panel to change the default admin password immediately.
6. **Create additional users** — Navigate to the **Users** page (admin only) to create accounts for your team.
7. **Firewall** — Ensure the backend port (default `8000`) is accessible from client machines. On Windows, the installer creates a firewall rule automatically. On Linux, check `ufw` or `iptables`.

---

## Troubleshooting

### "ODBC Driver not found" / connection errors

Ensure ODBC Driver 18 is installed (see [Prerequisites](#prerequisites)). On Linux, verify with:

```bash
odbcinst -q -d
```

You should see a line containing `ODBC Driver 18 for SQL Server`.

### Backend starts but cannot connect to SQL Server

- Verify `DB_SERVER`, `DB_NAME`, `DB_USERNAME`, and `DB_PASSWORD` are correct in your `.env` file.
- Ensure SQL Server is configured to allow TCP/IP connections and the SQL Server Browser service is running.
- Check that the SQL Server firewall allows connections on port 1433 (default).
- If using Azure SQL, ensure your IP is whitelisted in the Azure portal.

### Frontend shows "Could not connect" or "Offline"

- Ensure the backend is running and accessible from the machine where the frontend is open.
- If using the Tauri desktop app, verify the server address on the **Server Setup** screen matches the backend's host and port.
- Check for CORS issues if serving the frontend from a different domain (the backend allows all origins by default).

### "Session expired" errors

The default session timeout is 480 minutes (8 hours). If sessions expire too quickly, increase `ACCESS_TOKEN_EXPIRE_MINUTES` in the backend `.env` file and restart the service.

### Service won't start (Windows)

Check the logs at `<install dir>\logs\`. Common issues:
- Missing or incorrect `.env` values
- Port already in use — change the port in `.env` or the service configuration
- Permission issues — run the installer as Administrator

### Service won't start (Linux)

```bash
journalctl -u archivist-backend -n 50 --no-pager
```

Common issues:
- Python virtual environment not found — re-run the installer
- Missing ODBC driver — install `msodbcsql18`
- Port already in use — change the `PORT` in the systemd service file
