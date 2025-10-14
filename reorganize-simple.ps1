# SkyNest Project Reorganization Script

Write-Host "Starting reorganization..." -ForegroundColor Cyan

# Phase 1: Copy src/ to backend/src/
Write-Host "Copying src/ to backend/src/..." -ForegroundColor Yellow
Copy-Item -Path "src\*" -Destination "backend\src\" -Recurse -Force

# Phase 2: Copy models/ to backend/src/models/
Write-Host "Copying models/ to backend/src/models/..." -ForegroundColor Yellow
if (Test-Path "models") {
    Copy-Item -Path "models" -Destination "backend\src\models" -Recurse -Force
}

# Phase 3: Copy server.js
Write-Host "Copying server.js..." -ForegroundColor Yellow
Copy-Item -Path "server.js" -Destination "backend\server.js" -Force

# Phase 4: Copy schema
Write-Host "Copying schema..." -ForegroundColor Yellow
Copy-Item -Path "skynest_schema_nodb.sql" -Destination "backend\database\schema.sql" -Force

# Phase 5: Copy seeds
Write-Host "Copying seeds..." -ForegroundColor Yellow
if (Test-Path "seeds") {
    Copy-Item -Path "seeds\*" -Destination "backend\database\seeds\" -Recurse -Force
}

# Phase 6: Copy scripts
Write-Host "Copying scripts..." -ForegroundColor Yellow
if (Test-Path "scripts") {
    Copy-Item -Path "scripts\*" -Destination "backend\scripts\" -Recurse -Force
}

# Phase 7: Copy tests
Write-Host "Copying tests..." -ForegroundColor Yellow
if (Test-Path "tests") {
    Copy-Item -Path "tests" -Destination "backend\tests" -Recurse -Force
}

Write-Host "Done!" -ForegroundColor Green
