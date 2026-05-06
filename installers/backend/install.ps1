#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Archivist Backend Installer for Windows.
.DESCRIPTION
    Installs the Archivist backend API service on a Windows server alongside
    SQL Server. Checks prerequisites, configures the database connection, and
    optionally registers a Windows service via NSSM.
#>

param(
    [string]$InstallDir = "C:\Archivist\Backend",
    [switch]$SkipServiceInstall,
    [int]$Port = 8000
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ServiceName = "ArchivistBackend"
$NssmUrl = "https://nssm.cc/release/nssm-2.24.zip"

# --- Helpers ---------------------------------------------------------------

function Write-Step($msg) { Write-Host "`n>>> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "    $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "    $msg" -ForegroundColor Yellow }

function Test-CommandExists($cmd) {
    $null -ne (Get-Command $cmd -ErrorAction SilentlyContinue)
}

# --- Prerequisites ---------------------------------------------------------

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Archivist Backend Installer for Windows" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

Write-Step "Checking prerequisites"

# Python
if (-not (Test-CommandExists "python")) {
    Write-Host "    Python 3.11+ is required but was not found." -ForegroundColor Red
    Write-Host "    Download from https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host "    Make sure to check 'Add Python to PATH' during install." -ForegroundColor Yellow
    exit 1
}

$pyVer = (python --version 2>&1) -replace "Python ", ""
$pyMajor = [int]($pyVer.Split(".")[0])
$pyMinor = [int]($pyVer.Split(".")[1])
if ($pyMajor -lt 3 -or ($pyMajor -eq 3 -and $pyMinor -lt 11)) {
    Write-Host "    Python 3.11+ is required. Found $pyVer." -ForegroundColor Red
    exit 1
}
Write-Ok "Python $pyVer"

# ODBC Driver
$odbcDrivers = Get-OdbcDriver -Name "ODBC Driver*SQL Server" -ErrorAction SilentlyContinue
if (-not $odbcDrivers) {
    Write-Warn "ODBC Driver 18 for SQL Server not found."
    Write-Host "    Download from: https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server" -ForegroundColor Yellow
    $continue = Read-Host "    Continue anyway? (y/n)"
    if ($continue -ne "y") { exit 1 }
} else {
    Write-Ok "ODBC Driver found: $($odbcDrivers[0].Name)"
}

# pip
if (-not (Test-CommandExists "pip")) {
    Write-Warn "pip not found. Attempting to install..."
    python -m ensurepip --upgrade
}

# --- Database Configuration ------------------------------------------------

Write-Step "Database Configuration"

$DbServer   = Read-Host "    SQL Server hostname [localhost]"
if ([string]::IsNullOrWhiteSpace($DbServer)) { $DbServer = "localhost" }

$DbName     = Read-Host "    Database name [Archivist]"
if ([string]::IsNullOrWhiteSpace($DbName)) { $DbName = "Archivist" }

$DbUsername  = Read-Host "    SQL Server username [sa]"
if ([string]::IsNullOrWhiteSpace($DbUsername)) { $DbUsername = "sa" }

$DbPassword  = Read-Host "    SQL Server password" -AsSecureString
$DbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($DbPassword)
)

$DbDriver   = Read-Host "    ODBC driver name [ODBC Driver 18 for SQL Server]"
if ([string]::IsNullOrWhiteSpace($DbDriver)) { $DbDriver = "ODBC Driver 18 for SQL Server" }

$DbEncrypt  = Read-Host "    Connection encryption [Optional]"
if ([string]::IsNullOrWhiteSpace($DbEncrypt)) { $DbEncrypt = "Optional" }

$DbTrustCert = Read-Host "    Trust server certificate [Yes]"
if ([string]::IsNullOrWhiteSpace($DbTrustCert)) { $DbTrustCert = "Yes" }

# Generate a random JWT secret
$JwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 48 | ForEach-Object { [char]$_ })

$JwtExpiry  = Read-Host "    Access token expiry in minutes [480]"
if ([string]::IsNullOrWhiteSpace($JwtExpiry)) { $JwtExpiry = "480" }

# --- Installation -----------------------------------------------------------

Write-Step "Installing to $InstallDir"

if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

# Copy backend files
$SourceDir = Join-Path $PSScriptRoot "..\..\archivist-backend"
if (-not (Test-Path $SourceDir)) {
    Write-Host "    Backend source not found at $SourceDir" -ForegroundColor Red
    Write-Host "    Please run this script from the repository root's installers\backend\ directory." -ForegroundColor Yellow
    exit 1
}

Write-Ok "Copying backend files..."
Copy-Item -Path "$SourceDir\*" -Destination $InstallDir -Recurse -Force -Exclude @(".venv", "__pycache__", "*.pyc", ".env")

# Create virtual environment
Write-Step "Creating virtual environment"
$VenvDir = Join-Path $InstallDir ".venv"
if (-not (Test-Path $VenvDir)) {
    python -m venv $VenvDir
}
Write-Ok "Virtual environment created at $VenvDir"

# Install dependencies
Write-Step "Installing Python dependencies"
$PipExe = Join-Path $VenvDir "Scripts\pip.exe"
& $PipExe install --upgrade pip | Out-Null
& $PipExe install -r (Join-Path $InstallDir "pyproject.toml") 2>$null

# Use poetry export if available, otherwise install with pip + pyproject.toml
$PoetryAvailable = Test-CommandExists "poetry"
if ($PoetryAvailable) {
    Push-Location $InstallDir
    & (Join-Path $VenvDir "Scripts\python.exe") -m pip install poetry
    & (Join-Path $VenvDir "Scripts\poetry.exe") install --no-interaction
    Pop-Location
} else {
    & $PipExe install fastapi[standard] sqlalchemy pyodbc python-dateutil python-multipart passlib[bcrypt] python-jose[cryptography] python-dotenv argon2-cffi pandas openpyxl python-docx docxtpl uvicorn
}
Write-Ok "Dependencies installed"

# --- Generate .env ----------------------------------------------------------

Write-Step "Generating configuration"
$EnvContent = @"
# Archivist Backend Configuration
# Generated by installer on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# SQL Server connection
DB_SERVER=$DbServer
DB_NAME=$DbName
DB_USERNAME=$DbUsername
DB_PASSWORD=$DbPasswordPlain
DB_DRIVER=$DbDriver
DB_ENCRYPT=$DbEncrypt
DB_TRUST_CERT=$DbTrustCert

# JWT Authentication
JWT_SECRET_KEY=$JwtSecret
ACCESS_TOKEN_EXPIRE_MINUTES=$JwtExpiry
"@

$EnvFile = Join-Path $InstallDir ".env"
Set-Content -Path $EnvFile -Value $EnvContent -Encoding UTF8
Write-Ok "Configuration written to $EnvFile"

# --- Test Connection --------------------------------------------------------

Write-Step "Testing database connection"
$TestScript = @"
import sys
sys.path.insert(0, r'$InstallDir')
from dotenv import load_dotenv
load_dotenv(r'$EnvFile')
from app.database import engine
from sqlalchemy import text
try:
    with engine.connect() as c:
        c.execute(text('SELECT 1'))
    print('OK')
except Exception as e:
    print(f'FAIL: {e}')
    sys.exit(1)
"@

$PythonExe = Join-Path $VenvDir "Scripts\python.exe"
$result = & $PythonExe -c $TestScript 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Warn "Database connection test failed: $result"
    Write-Host "    You can edit $EnvFile and retry manually." -ForegroundColor Yellow
} else {
    Write-Ok "Database connection successful"
}

# --- Windows Service --------------------------------------------------------

if (-not $SkipServiceInstall) {
    Write-Step "Installing Windows service"

    # Download NSSM if not present
    $NssmDir = Join-Path $InstallDir "nssm"
    $NssmExe = Join-Path $NssmDir "nssm.exe"

    if (-not (Test-Path $NssmExe)) {
        Write-Ok "Downloading NSSM..."
        $ZipFile = Join-Path $env:TEMP "nssm.zip"
        try {
            Invoke-WebRequest -Uri $NssmUrl -OutFile $ZipFile -UseBasicParsing
            Expand-Archive -Path $ZipFile -DestinationPath $env:TEMP -Force
            if (-not (Test-Path $NssmDir)) { New-Item -ItemType Directory -Path $NssmDir -Force | Out-Null }
            $arch = if ([Environment]::Is64BitOperatingSystem) { "win64" } else { "win32" }
            Copy-Item "$env:TEMP\nssm-2.24\$arch\nssm.exe" $NssmExe
            Remove-Item $ZipFile -Force
            Remove-Item "$env:TEMP\nssm-2.24" -Recurse -Force
        } catch {
            Write-Warn "Failed to download NSSM. Service installation skipped."
            Write-Host "    You can download NSSM manually from https://nssm.cc" -ForegroundColor Yellow
            $SkipServiceInstall = $true
        }
    }

    if (-not $SkipServiceInstall) {
        # Remove existing service if present
        $existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
        if ($existing) {
            Write-Ok "Stopping existing service..."
            & $NssmExe stop $ServiceName 2>$null
            & $NssmExe remove $ServiceName confirm 2>$null
        }

        # Install service
        $UvicornExe = Join-Path $VenvDir "Scripts\uvicorn.exe"
        & $NssmExe install $ServiceName $UvicornExe "app.main:app --host 0.0.0.0 --port $Port"
        & $NssmExe set $ServiceName AppDirectory $InstallDir
        & $NssmExe set $ServiceName DisplayName "Archivist Backend API"
        & $NssmExe set $ServiceName Description "Archivist records management backend API service"
        & $NssmExe set $ServiceName Start SERVICE_AUTO_START

        # Set up log files
        $LogDir = Join-Path $InstallDir "logs"
        if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
        & $NssmExe set $ServiceName AppStdout (Join-Path $LogDir "stdout.log")
        & $NssmExe set $ServiceName AppStderr (Join-Path $LogDir "stderr.log")
        & $NssmExe set $ServiceName AppRotateFiles 1
        & $NssmExe set $ServiceName AppRotateBytes 1048576

        # Start the service
        Write-Ok "Starting service..."
        & $NssmExe start $ServiceName

        $svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
        if ($svc -and $svc.Status -eq "Running") {
            Write-Ok "Service '$ServiceName' is running"
        } else {
            Write-Warn "Service may not have started. Check logs at $LogDir"
        }
    }
}

# --- Done -------------------------------------------------------------------

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   Installation Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Install directory : $InstallDir" -ForegroundColor White
Write-Host "  Config file       : $EnvFile" -ForegroundColor White
Write-Host "  API port          : $Port" -ForegroundColor White
Write-Host "  API URL           : http://localhost:$Port" -ForegroundColor White
if (-not $SkipServiceInstall) {
    Write-Host "  Service name      : $ServiceName" -ForegroundColor White
}
Write-Host ""
Write-Host "  To run manually   : cd $InstallDir && .venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port $Port" -ForegroundColor Gray
Write-Host "  API docs          : http://localhost:$Port/docs" -ForegroundColor Gray
Write-Host ""
