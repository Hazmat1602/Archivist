# Archivist

A modern records management system for tracking physical archives, boxes, and folders with automated retention period calculations and lifecycle management.

## Architecture

- **Backend** (`archivist-backend/`): FastAPI + SQLAlchemy + SQL Server (via pyodbc)
- **Frontend** (`archivist-frontend/`): React + Vite + Tailwind CSS + shadcn/ui

## Features

- **Dashboard**: Overview of archive system with key metrics
- **Folders**: Create and manage record folders with auto-generated retention IDs and expiry calculation
- **Boxes**: Physical container management with auto-generated codes
- **Retention Codes**: Define retention categories and period rules (years, months, fixed date, permanent)
- **Locations**: Track on-site and off-site storage locations
- **Archives**: Manage long-term archive destinations
- **Import**: Bulk CSV import for boxes and folders
- **Settings**: View system configuration and database info
- **Large Dataset Support**: List endpoints support `offset` / `limit` pagination (default `limit=100`, max `1000`)

## Getting Started

### Prerequisites

- **ODBC Driver 18 for SQL Server** must be installed on the machine running the backend.
  - Windows: Included with SQL Server Management Studio, or [download here](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server)
  - Ubuntu/Debian:
    ```bash
    curl https://packages.microsoft.com/keys/microsoft.asc | sudo tee /etc/apt/trusted.gpg.d/microsoft.asc
    curl https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/prod.list | sudo tee /etc/apt/sources.list.d/mssql-release.list
    sudo apt-get update && sudo ACCEPT_EULA=Y apt-get install -y msodbcsql18 unixodbc-dev
    ```

### Backend

```bash
cd archivist-backend
cp .env.example .env   # Edit .env with your SQL Server credentials
poetry install
poetry run uvicorn app.main:app --reload
```

Configure your SQL Server connection by setting environment variables (or editing `.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_SERVER` | `localhost` | SQL Server hostname |
| `DB_NAME` | `Archivist` | Database name |
| `DB_USERNAME` | `sa` | SQL Server login |
| `DB_PASSWORD` | *(empty)* | SQL Server password |
| `DB_DRIVER` | `ODBC Driver 18 for SQL Server` | ODBC driver name |
| `DB_ENCRYPT` | `Optional` | Connection encryption |
| `DB_TRUST_CERT` | `Yes` | Trust server certificate |

The API will be available at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd archivist-frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### Configuration

Create a `.env` file in `archivist-frontend/`:

```
VITE_API_URL=http://localhost:8000
```

## Deployment / Installers

For production deployment, use the provided installers:

### Backend Installer (.exe)

Install the backend on the same server as the SQL Server database. The `.exe` installer provides a GUI wizard that configures the database connection, installs dependencies, and registers the API as a Windows service.

**Building the installer:**

```powershell
cd installers\backend
.\build_installer.ps1       # Requires Inno Setup 6 on the build machine
```

This produces `ArchivistBackendSetup.exe` — a self-contained installer that bundles embedded Python, NSSM, and all backend code. No prerequisites needed on the target server.

For Linux servers, a Bash install script (`install.sh`) is also provided.

See [`installers/backend/README.md`](installers/backend/README.md) for full details.

### Frontend Installer (Electron Desktop App)

The frontend can be packaged as a standalone desktop application using Electron. End users install the app and configure the server connection on first launch.

```bash
cd archivist-frontend
npm install
npm run electron:build    # Build installer (NSIS on Windows, AppImage/deb on Linux, dmg on macOS)
```

The built installer will be in `archivist-frontend/release/`.

For development with Electron:

```bash
npm run electron:dev      # Run Electron with Vite hot-reload
```

## Developer Experience Improvements

This repository includes a root `Makefile` with common tasks so you do not need to remember separate backend/frontend commands.

```bash
make install      # install backend + frontend dependencies
make dev-backend  # run FastAPI with reload
make dev-frontend # run Vite dev server
make lint         # run frontend lint + backend compile check
make build        # build frontend assets
```

Service-specific setup details live in:
- `archivist-backend/README.md`
- `archivist-frontend/README.md`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend Framework | FastAPI |
| ORM | SQLAlchemy |
| Database | SQL Server (via pyodbc) |
| Validation | Pydantic |
| Frontend Framework | React 18 |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Components | shadcn/ui (Radix UI) |
| Icons | Lucide React |
| Charts | Recharts |
