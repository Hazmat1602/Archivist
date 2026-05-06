# Archivist Backend Installer

Installs the Archivist backend API on the same server that hosts the SQL Server database.

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Python | 3.11+ | [python.org/downloads](https://www.python.org/downloads/) |
| ODBC Driver 18 for SQL Server | Latest | [Download](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server) |
| SQL Server | 2019+ | Must be running and accessible |

## Windows

### Quick Install

Run the installer from an **elevated** (Administrator) PowerShell prompt:

```powershell
.\install.ps1
```

The installer will:
1. Verify Python and ODBC driver are available
2. Prompt for SQL Server connection details
3. Copy files and install dependencies in a virtual environment
4. Generate a `.env` configuration file
5. Test the database connection
6. Install and start a Windows service (via NSSM)

### Options

```powershell
# Custom install directory
.\install.ps1 -InstallDir "D:\Services\Archivist"

# Custom API port
.\install.ps1 -Port 9000

# Skip Windows service installation (run manually)
.\install.ps1 -SkipServiceInstall
```

### Running Manually

If you chose to skip service installation:

```powershell
cd C:\Archivist\Backend
.venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000
```

### Uninstall

```powershell
.\uninstall.ps1                     # Stop service, keep files
.\uninstall.ps1 -RemoveFiles        # Stop service and delete all files
```

## Linux

### Quick Install

```bash
chmod +x install.sh
sudo ./install.sh
```

Or specify a custom install directory:

```bash
sudo ./install.sh /opt/archivist/backend
```

Set a custom port via environment variable:

```bash
ARCHIVIST_PORT=9000 sudo ./install.sh
```

### Managing the Service

```bash
sudo systemctl status archivist-backend
sudo systemctl restart archivist-backend
sudo journalctl -u archivist-backend -f
```

### Uninstall

```bash
chmod +x uninstall.sh
sudo ./uninstall.sh
```

## Configuration

After installation, the configuration lives in `.env` inside the install directory. Edit this file to change database credentials, JWT settings, or other options.

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_SERVER` | `localhost` | SQL Server hostname |
| `DB_NAME` | `Archivist` | Database name |
| `DB_USERNAME` | `sa` | SQL Server login |
| `DB_PASSWORD` | *(set during install)* | SQL Server password |
| `DB_DRIVER` | `ODBC Driver 18 for SQL Server` | ODBC driver name |
| `DB_ENCRYPT` | `Optional` | Connection encryption |
| `DB_TRUST_CERT` | `Yes` | Trust server certificate |
| `JWT_SECRET_KEY` | *(auto-generated)* | JWT signing secret |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | Session timeout |

After editing, restart the service for changes to take effect.

## Firewall

Ensure the API port (default `8000`) is open for incoming connections from client machines:

**Windows:**
```powershell
New-NetFirewallRule -DisplayName "Archivist API" -Direction Inbound -Port 8000 -Protocol TCP -Action Allow
```

**Linux:**
```bash
sudo ufw allow 8000/tcp
```
