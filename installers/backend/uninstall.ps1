#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Uninstalls the Archivist Backend service and optionally removes files.
#>

param(
    [string]$InstallDir = "C:\Archivist\Backend",
    [switch]$RemoveFiles
)

$ServiceName = "ArchivistBackend"

Write-Host ""
Write-Host "Archivist Backend Uninstaller" -ForegroundColor Cyan
Write-Host ""

# Stop and remove service
$ServiceExe = Join-Path $InstallDir "service\ArchivistBackend.exe"
$svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue

if ($svc) {
    Write-Host "Stopping service '$ServiceName'..." -ForegroundColor Yellow
    if (Test-Path $ServiceExe) {
        & $ServiceExe stop 2>$null
        & $ServiceExe uninstall 2>$null
    } else {
        Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
        sc.exe delete $ServiceName 2>$null
    }
    Write-Host "Service removed." -ForegroundColor Green
} else {
    Write-Host "Service '$ServiceName' not found (already removed)." -ForegroundColor Gray
}

# Remove files
if ($RemoveFiles) {
    if (Test-Path $InstallDir) {
        Write-Host "Removing $InstallDir..." -ForegroundColor Yellow
        Remove-Item -Path $InstallDir -Recurse -Force
        Write-Host "Files removed." -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "Installation files were kept at $InstallDir" -ForegroundColor Gray
    Write-Host "To remove: Remove-Item -Recurse -Force '$InstallDir'" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Uninstall complete." -ForegroundColor Green
