$ErrorActionPreference = "Stop"

$root    = $PSScriptRoot
$output  = Join-Path $root "deploy"
$standalone = Join-Path $root ".next\standalone"

if (-not (Test-Path $standalone)) {
    Write-Error "Standalone build not found. Run 'npm run build' first."
    exit 1
}

# Clean previous deploy folder
if (Test-Path $output) { Remove-Item $output -Recurse -Force }

Write-Host "Copying standalone build..." -ForegroundColor Cyan
Copy-Item $standalone $output -Recurse

Write-Host "Copying static assets..." -ForegroundColor Cyan
$staticSrc  = Join-Path $root ".next\static"
$staticDest = Join-Path $output ".next\static"
if (Test-Path $staticSrc) {
    Copy-Item $staticSrc $staticDest -Recurse
}

Write-Host "Copying public folder..." -ForegroundColor Cyan
$publicSrc  = Join-Path $root "public"
$publicDest = Join-Path $output "public"
if (Test-Path $publicSrc) {
    Copy-Item $publicSrc $publicDest -Recurse
}

Write-Host "Copying web.config..." -ForegroundColor Cyan
Copy-Item (Join-Path $root "web.config") (Join-Path $output "web.config")

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host " Deploy folder ready: $output" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Copy the 'deploy' folder contents to your IIS site directory"
Write-Host "  2. Set NEXT_PUBLIC_API_URL and PORT environment variables on the server"
Write-Host "  3. Make sure iisnode is installed on the IIS server"
Write-Host "  4. Point the IIS site to the deploy folder"
Write-Host ""
