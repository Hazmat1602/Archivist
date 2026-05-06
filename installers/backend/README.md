# Archivist Backend Installer

Installs the Archivist backend API on the same server that hosts the SQL Server database.

## Building the Installer (.exe)

The primary installer is a standalone `.exe` built with [Inno Setup](https://jrsoftware.org/isinfo.php). It bundles an embedded Python distribution, NSSM (for Windows service management), and the backend source code — so the target server needs no pre-installed dependencies.

### Prerequisites (Build Machine Only)

| Requirement | Purpose |
|-------------|---------|
| [Inno Setup 6](https://jrsoftware.org/isdl.php) | Compiles the `.iss` script into an `.exe` installer |
| PowerShell 5.1+ | Runs the build script |
| Internet access | Downloads embedded Python and NSSM during build |

### Build Steps

1. Open PowerShell on a **Windows** machine with Inno Setup installed
2. Run the build script:

```powershell
cd installers\backend
.\build_installer.ps1
```

3. The compiled installer will be at `installers\backend\output\ArchivistBackendSetup.exe`

#### Build Options

```powershell
# Use a specific Python version
.\build_installer.ps1 -PythonVersion "3.12.7"

# Use a specific NSSM version
.\build_installer.ps1 -NssmVersion "2.24"
```

## Running the Installer

Transfer `ArchivistBackendSetup.exe` to the target server and run it. The installer wizard will:

1. **Select install directory** — default: `C:\Program Files\Archivist\Backend`
2. **Database Configuration** — SQL Server hostname, database name, username, and password
3. **Advanced Database Settings** — ODBC driver name, encryption, and certificate trust (defaults work for most setups)
4. **Service Configuration** — API port (default 8000) and session timeout
5. **Install** — copies files, installs Python dependencies, registers the Windows service, opens the firewall port, and starts the service

### What the Installer Does

- Copies the backend app and an embedded Python runtime to the install directory
- Generates a `.env` configuration file from the wizard inputs
- Installs all Python dependencies via pip (offline-capable if packages are pre-cached)
- Registers `ArchivistBackend` as a Windows service using NSSM
- Configures automatic service restart and log rotation
- Adds a Windows Firewall inbound rule for the API port

### After Installation

- **API URL**: `http://localhost:8000` (or the port you chose)
- **API docs**: `http://localhost:8000/docs`
- **Logs**: `<install dir>\logs\`

Manage the service:

```powershell
# Status
nssm status ArchivistBackend

# Restart
nssm restart ArchivistBackend

# Stop
nssm stop ArchivistBackend
```

### Uninstall

Use **Add/Remove Programs** in Windows Settings. The uninstaller stops and removes the Windows service and firewall rule automatically.

## Alternative: Script-Based Install

For Linux servers or manual Windows installs without the .exe, standalone scripts are provided:

| Script | Platform | Description |
|--------|----------|-------------|
| `install.ps1` | Windows | Interactive PowerShell installer |
| `install.sh` | Linux | Interactive Bash installer (uses systemd) |
| `uninstall.ps1` | Windows | Removes service and optionally files |
| `uninstall.sh` | Linux | Removes systemd service and optionally files |

## Configuration

After installation, the configuration lives in `.env` inside the install directory. Edit this file to change database credentials, JWT settings, or other options:

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

Restart the service after editing `.env`.

## Firewall

The installer automatically creates a firewall rule. If you need to add it manually:

```powershell
New-NetFirewallRule -DisplayName "Archivist API" -Direction Inbound -Port 8000 -Protocol TCP -Action Allow
```
