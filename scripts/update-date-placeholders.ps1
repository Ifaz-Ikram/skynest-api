$appJsxPath = "C:\Users\Ifaz\Desktop\skynest-api\frontend\src\App.jsx"
$content = Get-Content $appJsxPath -Raw

# Add placeholder to date inputs that don't have it
$content = $content -replace '(type="date"[^\n]*\n[^\n]*\n[^\n]*className="input-field")(\s*\n\s*required)', '$1 placeholder="DD/MM/YYYY"$2'
$content = $content -replace '(type="date"[^\n]*\n[^\n]*\n[^\n]*className="input-field")(\s*\n\s*/>)', '$1 placeholder="DD/MM/YYYY"$2'

# Remove duplicate placeholders
$content = $content -replace 'placeholder="DD/MM/YYYY"\s+placeholder="DD/MM/YYYY"', 'placeholder="DD/MM/YYYY"'

$content | Set-Content $appJsxPath

Write-Host "✅ Updated all date input placeholders to DD/MM/YYYY"
