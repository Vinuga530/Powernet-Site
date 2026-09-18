param (
    [switch]$DryRun
)

$ErrorActionPreference = "SilentlyContinue"
$rootDir = (Get-Location).Path
$srcDir = Join-Path $rootDir "src"
$publicDir = Join-Path $rootDir "public"

$managedDirs = @(
    (Join-Path $publicDir "images\projects"),
    (Join-Path $publicDir "images\logos"),
    (Join-Path $publicDir "images\hero"),
    (Join-Path $publicDir "videos\hero")
)

$protectedFiles = @(
    ".gitkeep",
    "favicon.ico",
    "favicon.svg",
    "site.webmanifest",
    "powernet-logo-coloured.png"
)

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " 🧹 Powernet Media Cleanup Tool (PowerShell)" -ForegroundColor Cyan
if ($DryRun) {
    Write-Host " Mode: DRY RUN (Preview only, no files will be deleted)" -ForegroundColor Yellow
} else {
    Write-Host " Mode: ACTIVE CLEANUP (Unused media will be deleted)" -ForegroundColor Green
}
Write-Host "====================================================" -ForegroundColor Cyan

# Collect all text content from src/ to find referenced assets
Write-Host "Scanning source files in src/ for active media references..." -ForegroundColor Gray
$allSourceFiles = Get-ChildItem -Path $srcDir -Recurse -File | Where-Object {
    $_.Extension -in @(".yaml", ".yml", ".astro", ".ts", ".js", ".json", ".md", ".css")
}

$allSourceText = ($allSourceFiles | Get-Content -Raw) -join "`n"

$totalDeletedCount = 0
$totalBytesFreed = 0
$filesToDelete = @()

foreach ($dir in $managedDirs) {
    if (-not (Test-Path $dir)) { continue }

    $mediaFiles = Get-ChildItem -Path $dir -Recurse -File
    foreach ($file in $mediaFiles) {
        $fileName = $file.Name
        if ($protectedFiles -contains $fileName.ToLower()) { continue }

        # Check various path formats (e.g. /images/projects/name.jpg or just name.jpg)
        $relPathSlash = ($file.FullName.Substring($publicDir.Length)).Replace("\", "/")
        $relPathNoSlash = $relPathSlash.TrimStart("/")

        $isReferenced = (
            $allSourceText.Contains($relPathSlash) -or
            $allSourceText.Contains($relPathNoSlash) -or
            $allSourceText.Contains($fileName)
        )

        if (-not $isReferenced) {
            $filesToDelete += $file
            $totalBytesFreed += $file.Length
            $totalDeletedCount++
        }
    }
}

if ($filesToDelete.Count -eq 0) {
    Write-Host "✅ No unused media found! All assets are actively referenced on the site." -ForegroundColor Green
    Write-Host "====================================================" -ForegroundColor Cyan
    exit 0
}

Write-Host "`nFound $($filesToDelete.Count) unreferenced file(s):" -ForegroundColor Yellow

foreach ($file in $filesToDelete) {
    $rel = ($file.FullName.Substring($rootDir.Length)).TrimStart("\")
    $sizeKb = [math]::Round($file.Length / 1KB, 2)
    $sizeStr = "$sizeKb KB".PadLeft(10)

    if ($DryRun) {
        Write-Host "  [WOULD DELETE] $sizeStr  $rel" -ForegroundColor Yellow
    } else {
        Remove-Item -Path $file.FullName -Force
        Write-Host "  [DELETED]      $sizeStr  $rel" -ForegroundColor Red
    }
}

# Clean empty subdirectories in managed directories
$emptyDirsRemoved = 0
foreach ($dir in $managedDirs) {
    if (-not (Test-Path $dir)) { continue }
    $subDirs = Get-ChildItem -Path $dir -Recurse -Directory | Sort-Object -Property FullName -Descending
    foreach ($sub in $subDirs) {
        $items = Get-ChildItem -Path $sub.FullName -Force
        if ($items.Count -eq 0) {
            if (-not $DryRun) {
                Remove-Item -Path $sub.FullName -Force
            }
            $emptyDirsRemoved++
        }
    }
}

$freedFormatted = "$([math]::Round($totalBytesFreed / 1MB, 2)) MB"
Write-Host "`n----------------------------------------------------" -ForegroundColor Gray
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Files $(if ($DryRun) { 'to delete' } else { 'deleted' }):    $totalDeletedCount"
Write-Host "  Disk space $(if ($DryRun) { 'reclaimable' } else { 'freed' }):   $freedFormatted"
if ($emptyDirsRemoved -gt 0) {
    Write-Host "  Empty folders cleaned: $emptyDirsRemoved"
}

if ($DryRun) {
    Write-Host "`nTo actually delete these files, run: .\scripts\cleanup-media.ps1" -ForegroundColor Yellow
} else {
    Write-Host "`n✅ Media cleanup complete! Site is lean and fast." -ForegroundColor Green
}
Write-Host "====================================================`n" -ForegroundColor Cyan
