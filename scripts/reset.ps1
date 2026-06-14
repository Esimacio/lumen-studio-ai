# scripts/reset.ps1
# Resets portable app dependencies/builds while preserving user models and outputs.

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir   = Split-Path -Parent $scriptDir
$appDir    = Join-Path $rootDir "app"

Write-Host ""
Write-Host "  ============================================================" -ForegroundColor Yellow
Write-Host "   Resetting Local AI Studio..." -ForegroundColor Yellow
Write-Host "  ============================================================" -ForegroundColor Yellow
Write-Host ""

# Delete tools/node
$toolsDir = Join-Path $appDir "tools"
if (Test-Path $toolsDir) {
    Write-Host "   >> Removing portable tools/ node folder..." -ForegroundColor Cyan
    Remove-Item $toolsDir -Recurse -Force -ErrorAction SilentlyContinue
}

# Delete backend
$backendDir = Join-Path $appDir "backend"
if (Test-Path $backendDir) {
    Write-Host "   >> Removing image backend binaries..." -ForegroundColor Cyan
    Remove-Item $backendDir -Recurse -Force -ErrorAction SilentlyContinue
}

# Delete llama.cpp backend
$llmBackendDir = Join-Path $appDir "llm-backend"
if (Test-Path $llmBackendDir) {
    Write-Host "   >> Removing llama.cpp text backend binaries..." -ForegroundColor Cyan
    Remove-Item $llmBackendDir -Recurse -Force -ErrorAction SilentlyContinue
}

# Delete dist
$distDir = Join-Path $appDir "dist"
if (Test-Path $distDir) {
    Write-Host "   >> Removing dist/ build folder..." -ForegroundColor Cyan
    Remove-Item $distDir -Recurse -Force -ErrorAction SilentlyContinue
}

# Preserve image models
$modelsDir = Join-Path $appDir "models"
if (Test-Path $modelsDir) {
    Write-Host "   >> Preserving image models in app/models." -ForegroundColor Cyan
}

# Preserve text models
$llmModelsDir = Join-Path $appDir "llm-models"
if (Test-Path $llmModelsDir) {
    Write-Host "   >> Preserving text models in app/llm-models." -ForegroundColor Cyan
}

# Preserve OpenVINO models
$openVinoModelsDir = Join-Path $appDir "openvino-models"
if (Test-Path $openVinoModelsDir) {
    Write-Host "   >> Preserving OpenVINO models in app/openvino-models." -ForegroundColor Cyan
}

# Delete all frontend dependency folders, including platform-specific copies
$frontendDir = Join-Path $appDir "frontend"
Get-ChildItem $frontendDir -Force -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -eq "node_modules" -or $_.Name -like "node_modules_*" } |
    ForEach-Object {
        Write-Host "   >> Removing frontend $($_.Name)..." -ForegroundColor Cyan
        Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }

$activeOsFile = Join-Path $frontendDir ".active_modules_os"
if (Test-Path $activeOsFile) {
    Write-Host "   >> Removing frontend platform marker..." -ForegroundColor Cyan
    Remove-Item $activeOsFile -Force -ErrorAction SilentlyContinue
}


# Delete package-lock.json in frontend
$lockFile = Join-Path $appDir "frontend\package-lock.json"
if (Test-Path $lockFile) {
    Write-Host "   >> Removing frontend package-lock.json..." -ForegroundColor Cyan
    Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "  ============================================================" -ForegroundColor Green
Write-Host "   Reset complete. Image models, text models, OpenVINO models, and generated outputs were preserved." -ForegroundColor Green
Write-Host "  ============================================================" -ForegroundColor Green
Write-Host ""
Read-Host "  Press Enter to close..."
