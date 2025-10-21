# Add background and text colors to all input/select/textarea elements

Write-Host "Fixing input field colors..."
$files = Get-ChildItem -Path "frontend\src\components" -Recurse -Filter "*.jsx" | Select-Object -ExpandProperty FullName

$count = 0
foreach ($file in $files) {
    $relativePath = $file -replace [regex]::Escape((Get-Location).Path + "\"), ""
    $content = Get-Content $file -Raw
    $originalContent = $content
    
    # Pattern 1: Input fields with border classes but no background
    # Add bg and text color after the last border/focus class and before closing quote
    $content = $content -replace '(<input[^>]*className="[^"]*border[^"]*focus:[^"]*)(transition-all")', '$1 transition-all bg-surface-secondary text-text-primary dark:bg-slate-700 dark:text-slate-100 placeholder:text-text-tertiary"'
    
    # Pattern 2: Select elements
    $content = $content -replace '(<select[^>]*className="[^"]*)(rounded[^"]*)"([^>]*(?!bg-surface|bg-slate))', '$1$2 bg-surface-secondary text-text-primary dark:bg-slate-700 dark:text-slate-100"$3'
    
    # Pattern 3: Textarea elements
    $content = $content -replace '(<textarea[^>]*className="[^"]*)(rounded[^"]*)"([^>]*(?!bg-surface|bg-slate))', '$1$2 bg-surface-secondary text-text-primary dark:bg-slate-700 dark:text-slate-100 placeholder:text-text-tertiary"$3'
    
    # Only save if changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file -Value $content -NoNewline
        Write-Host "Fixed $relativePath"
        $count++
    }
}

Write-Host "`nInput color fixes completed! Updated $count files."

