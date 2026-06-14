param([string]$Release = "b9631")

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$appDir = Join-Path $rootDir "app"
$toolsDir = Join-Path $appDir "tools"
$llmRoot = Join-Path $appDir "llm-backend\win"

function Install-LlamaArchive {
    param([string]$Variant, [string]$AssetName)

    $dest = Join-Path $llmRoot $Variant
    $server = Join-Path $dest "llama-server.exe"
    if (Test-Path $server) {
        Write-Host "   OK  llama.cpp $Variant backend already ready."
        return
    }

    $archive = Join-Path $toolsDir $AssetName
    $extract = Join-Path $toolsDir "llama-$Variant-extract"
    $url = "https://github.com/ggml-org/llama.cpp/releases/download/$Release/$AssetName"

    New-Item -ItemType Directory -Force -Path $toolsDir, $dest | Out-Null
    Remove-Item $archive, $extract -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   >>  Downloading llama.cpp $Variant backend ($Release)..."
    Invoke-WebRequest -UseBasicParsing -Headers @{ "User-Agent" = "Local-AI-Studio" } -Uri $url -OutFile $archive
    Expand-Archive -Path $archive -DestinationPath $extract -Force

    Get-ChildItem $extract -Recurse -File | ForEach-Object {
        Copy-Item $_.FullName (Join-Path $dest $_.Name) -Force
    }
    Remove-Item $archive, $extract -Recurse -Force -ErrorAction SilentlyContinue

    if (-not (Test-Path $server)) {
        throw "llama-server.exe was not found after extracting $AssetName"
    }
    Write-Host "   OK  llama.cpp $Variant backend installed."
}

Install-LlamaArchive -Variant "vulkan" -AssetName "llama-$Release-bin-win-vulkan-x64.zip"
Install-LlamaArchive -Variant "cpu" -AssetName "llama-$Release-bin-win-cpu-x64.zip"
