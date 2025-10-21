# Comprehensive color fix script for all components
# This fixes white/light backgrounds and light text across the entire app

$componentsPath = "src\components"

Write-Host "Starting comprehensive color fixes..." -ForegroundColor Cyan

# Define all replacements for better dark mode contrast
$replacements = @(
    # Main backgrounds
    @{ Pattern = 'bg-white(?!\/)'; Replace = 'bg-slate-800' }
    @{ Pattern = 'bg-gray-50(?!\/)'; Replace = 'bg-slate-900' }
    @{ Pattern = 'bg-gray-100(?!\/)'; Replace = 'bg-slate-800' }
    
    # Text colors - make much darker for readability
    @{ Pattern = 'text-gray-500'; Replace = 'text-slate-300' }
    @{ Pattern = 'text-gray-600'; Replace = 'text-slate-200' }
    @{ Pattern = 'text-gray-700'; Replace = 'text-slate-100' }
    @{ Pattern = 'text-gray-800'; Replace = 'text-white' }
    @{ Pattern = 'text-gray-900'; Replace = 'text-white' }
    
    # Borders
    @{ Pattern = 'border-gray-200'; Replace = 'border-slate-700' }
    @{ Pattern = 'border-gray-300'; Replace = 'border-slate-600' }
    
    # Hover states
    @{ Pattern = 'hover:bg-gray-50'; Replace = 'hover:bg-slate-800' }
    @{ Pattern = 'hover:bg-gray-100'; Replace = 'hover:bg-slate-700' }
    
    # Dividers
    @{ Pattern = 'divide-gray-200'; Replace = 'divide-slate-700' }
    @{ Pattern = 'divide-gray-300'; Replace = 'divide-slate-600' }
)

# Get all JSX files
$files = Get-ChildItem -Path $componentsPath -Recurse -Filter "*.jsx"

$totalFiles = $files.Count
$processedFiles = 0
$modifiedFiles = 0

foreach ($file in $files) {
    $processedFiles++
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content
    $modified = $false
    
    # Apply all replacements
    foreach ($replacement in $replacements) {
        $pattern = $replacement.Pattern
        $replace = $replacement.Replace
        
        if ($content -match $pattern) {
            $content = $content -replace $pattern, $replace
            $modified = $true
        }
    }
    
    # Write back if modified
    if ($modified -and $content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $modifiedFiles++
        Write-Host "✓ Fixed: $($file.Name)" -ForegroundColor Green
    }
    
    # Progress indicator
    $percent = [math]::Round(($processedFiles / $totalFiles) * 100)
    Write-Progress -Activity "Fixing colors" -Status "$processedFiles of $totalFiles files" -PercentComplete $percent
}

Write-Progress -Activity "Fixing colors" -Completed

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "Color fix complete!" -ForegroundColor Green
Write-Host "Total files processed: $totalFiles" -ForegroundColor Yellow
Write-Host "Files modified: $modifiedFiles" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "`nPlease refresh your browser to see the changes." -ForegroundColor Magenta
