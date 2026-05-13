<#
.SYNOPSIS
    Builds the Archivist Backend installer .exe.
.DESCRIPTION
    Downloads an embedded Python distribution and WinSW, copies the backend
    source code, and compiles the Inno Setup script into a standalone
    installer executable.
.PARAMETER PythonVersion
    Embedded Python version to bundle (default: 3.12.7).
.PARAMETER WinswVersion
    WinSW version to bundle (default: 2.12.0).
#>

param(
    [string]$PythonVersion = "3.12.7",
    [string]$WinswVersion = "2.12.0"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ScriptDir = $PSScriptRoot
$BuildDir = Join-Path $ScriptDir "build"
$BackendSrc = Join-Path $ScriptDir "..\..\archivist-backend"

$OfflineDependencies = @(
    'fastapi[standard]','sqlalchemy','pyodbc','python-dateutil','python-multipart',
    'passlib[bcrypt]','python-jose[cryptography]','python-dotenv','argon2-cffi',
    'pandas','openpyxl','python-docx','docxtpl','uvicorn'
)

function Write-Step($msg) { Write-Host "`n>>> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "    $msg" -ForegroundColor Green }

# --- Validate ---------------------------------------------------------------

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Archivist Backend Installer Builder" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

if (-not (Test-Path $BackendSrc)) {
    Write-Host "Backend source not found at $BackendSrc" -ForegroundColor Red
    exit 1
}

# Check for Inno Setup Compiler
$IsccPaths = @(
    "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
    "${env:ProgramFiles}\Inno Setup 6\ISCC.exe"
)
$IsccExe = $null
foreach ($p in $IsccPaths) {
    if (Test-Path $p) { $IsccExe = $p; break }
}
if (-not $IsccExe) {
    Write-Host "Inno Setup 6 not found. Install from https://jrsoftware.org/isinfo.php" -ForegroundColor Red
    exit 1
}
Write-Ok "Inno Setup found at $IsccExe"

# --- Clean & prepare -------------------------------------------------------

Write-Step "Preparing build directory"
if (Test-Path $BuildDir) { Remove-Item -Path $BuildDir -Recurse -Force }
New-Item -ItemType Directory -Path $BuildDir -Force | Out-Null

# --- Download embedded Python -----------------------------------------------

Write-Step "Downloading Python $PythonVersion embedded"
$PyZipName = "python-$PythonVersion-embed-amd64.zip"
$PyZipUrl = "https://www.python.org/ftp/python/$PythonVersion/$PyZipName"
$PyZipFile = Join-Path $env:TEMP $PyZipName
$PyDir = Join-Path $BuildDir "python"

Invoke-WebRequest -Uri $PyZipUrl -OutFile $PyZipFile -UseBasicParsing
Expand-Archive -Path $PyZipFile -DestinationPath $PyDir -Force
Remove-Item $PyZipFile -Force

# Enable pip in embedded Python by uncommenting import site and adding
# Lib\site-packages to the python3xx._pth file so pip-installed packages
# (uvicorn, fastapi, etc.) are found on the import path.
$PthFile = Get-ChildItem $PyDir -Filter "python*._pth" | Select-Object -First 1
if ($PthFile) {
    $content = Get-Content $PthFile.FullName
    $content = $content -replace "^#import site", "import site"
    Set-Content $PthFile.FullName $content
    # Add Lib\site-packages explicitly for embedded Python
    Add-Content $PthFile.FullName "Lib\site-packages"
}
Write-Ok "Python embedded extracted to $PyDir"

# Bootstrap pip
Write-Step "Installing pip into embedded Python"
$GetPipUrl = "https://bootstrap.pypa.io/get-pip.py"
$GetPipFile = Join-Path $env:TEMP "get-pip.py"
Invoke-WebRequest -Uri $GetPipUrl -OutFile $GetPipFile -UseBasicParsing
& (Join-Path $PyDir "python.exe") $GetPipFile --no-warn-script-location
Remove-Item $GetPipFile -Force
Write-Ok "pip installed"

# --- Build offline wheelhouse -----------------------------------------------

Write-Step "Downloading Python dependency wheels for offline install"
$WheelhouseDir = Join-Path $BuildDir "wheelhouse"
New-Item -ItemType Directory -Path $WheelhouseDir -Force | Out-Null
& (Join-Path $PyDir "python.exe") -m pip download --dest $WheelhouseDir @OfflineDependencies
Write-Ok "Offline wheelhouse created at $WheelhouseDir"

# --- Download WinSW ---------------------------------------------------------

Write-Step "Downloading WinSW $WinswVersion"
$WinswUrl = "https://github.com/winsw/winsw/releases/download/v$WinswVersion/WinSW-x64.exe"
$WinswDir = Join-Path $BuildDir "winsw"
New-Item -ItemType Directory -Path $WinswDir -Force | Out-Null

$WinswExe = Join-Path $WinswDir "ArchivistBackend.exe"
Invoke-WebRequest -Uri $WinswUrl -OutFile $WinswExe -UseBasicParsing
Write-Ok "WinSW downloaded to $WinswDir"

# --- Copy backend source ----------------------------------------------------

Write-Step "Copying backend source"
$AppDir = Join-Path $BuildDir "app"
Copy-Item -Path "$BackendSrc\app" -Destination $AppDir -Recurse -Force
Copy-Item -Path "$BackendSrc\pyproject.toml" -Destination $BuildDir -Force
Copy-Item -Path "$BackendSrc\poetry.lock" -Destination $BuildDir -Force

if (Test-Path "$BackendSrc\.env.example") {
    Copy-Item "$BackendSrc\.env.example" -Destination $BuildDir -Force
}

# Exclude __pycache__
Get-ChildItem -Path $BuildDir -Directory -Recurse -Filter "__pycache__" | Remove-Item -Recurse -Force
Write-Ok "Backend source copied"

# --- Compile Inno Setup script ----------------------------------------------

Write-Step "Compiling installer"
$IssFile = Join-Path $ScriptDir "setup.iss"

$OutputDir = Join-Path $ScriptDir "output"
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

& $IsccExe $IssFile
if ($LASTEXITCODE -ne 0) {
    Write-Host "Inno Setup compilation failed." -ForegroundColor Red
    exit 1
}

Write-Ok "Installer built successfully!"
$ExeFile = Join-Path $OutputDir "ArchivistBackendSetup.exe"
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   Output: $ExeFile" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# --- Cleanup ----------------------------------------------------------------

Write-Step "Cleaning up build directory"
Remove-Item -Path $BuildDir -Recurse -Force
Write-Ok "Done"
