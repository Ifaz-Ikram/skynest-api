# SkyNest Project Reorganization Script
# This script reorganizes the project into backend/ and frontend/ structure

Write-Host "🚀 Starting SkyNest Project Reorganization..." -ForegroundColor Cyan
Write-Host ""

# Phase 1: Move backend core files
Write-Host "📦 Phase 1: Moving backend core files..." -ForegroundColor Yellow

# Copy src/ contents to backend/src/
Write-Host "  - Copying src/ to backend/src/..." -ForegroundColor Gray
Copy-Item -Path "src\*" -Destination "backend\src\" -Recurse -Force

# Copy models/ to backend/src/models/
Write-Host "  - Copying models/ to backend/src/models/..." -ForegroundColor Gray
if (Test-Path "models") {
    Copy-Item -Path "models" -Destination "backend\src\models" -Recurse -Force
}

# Copy server.js
Write-Host "  - Copying server.js to backend/..." -ForegroundColor Gray
Copy-Item -Path "server.js" -Destination "backend\server.js" -Force

Write-Host "  ✅ Phase 1 Complete" -ForegroundColor Green
Write-Host ""

# Phase 2: Move database files
Write-Host "📊 Phase 2: Moving database files..." -ForegroundColor Yellow

# Copy schema file
Write-Host "  - Copying schema file..." -ForegroundColor Gray
Copy-Item -Path "skynest_schema_nodb.sql" -Destination "backend\database\schema.sql" -Force

# Copy seeds
Write-Host "  - Copying seed files..." -ForegroundColor Gray
if (Test-Path "seeds") {
    Copy-Item -Path "seeds\*" -Destination "backend\database\seeds\" -Recurse -Force
}

Write-Host "  ✅ Phase 2 Complete" -ForegroundColor Green
Write-Host ""

# Phase 3: Move scripts and tests
Write-Host "🔧 Phase 3: Moving scripts and tests..." -ForegroundColor Yellow

# Copy scripts
Write-Host "  - Copying scripts..." -ForegroundColor Gray
if (Test-Path "scripts") {
    Copy-Item -Path "scripts\*" -Destination "backend\scripts\" -Recurse -Force
}

# Copy tests
Write-Host "  - Copying tests..." -ForegroundColor Gray
if (Test-Path "tests") {
    Copy-Item -Path "tests" -Destination "backend\tests" -Recurse -Force
}

Write-Host "  ✅ Phase 3 Complete" -ForegroundColor Green
Write-Host ""

# Phase 4: Copy package.json and create backend package.json
Write-Host "📝 Phase 4: Setting up backend package.json..." -ForegroundColor Yellow

# Create backend package.json
$backendPackage = @{
    name = "skynest-backend"
    version = "1.0.0"
    description = "SkyNest Hotel Management System - Backend API"
    main = "server.js"
    scripts = @{
        dev = "nodemon server.js"
        start = "node server.js"
        test = "jest"
        "db:migrate" = "node database/migrate.js"
        "db:seed" = "node database/seeds/index.js"
    }
    keywords = @("hotel", "management", "api", "postgresql")
    author = ""
    license = "ISC"
}

$backendPackage | ConvertTo-Json -Depth 10 | Set-Content "backend\package.json"

Write-Host "  ✅ Phase 4 Complete" -ForegroundColor Green
Write-Host ""

# Phase 5: Create backend .env template
Write-Host "⚙️ Phase 5: Creating backend .env..." -ForegroundColor Yellow

$envContent = @"
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=skynest_db
DB_PASSWORD=your_password
DB_PORT=5432

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=4000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173
"@

Set-Content -Path "backend\.env.example" -Value $envContent

Write-Host "  ✅ Phase 5 Complete" -ForegroundColor Green
Write-Host ""

# Phase 6: Create backend README
Write-Host "📚 Phase 6: Creating backend documentation..." -ForegroundColor Yellow

$backendReadme = @"
# SkyNest Backend API

Backend REST API for SkyNest Hotel Management System.

## 📁 Project Structure

\`\`\`
backend/
├── src/
│   ├── controllers/      # Request handlers
│   ├── routes/           # API routes
│   ├── middleware/       # Auth, validation, RBAC
│   ├── models/           # Database models
│   ├── utils/            # Helper functions
│   ├── schemas/          # Validation schemas
│   └── db/               # Database connection
├── database/
│   ├── schema.sql        # Database schema
│   └── seeds/            # Seed data
├── scripts/              # Utility scripts
├── tests/                # API tests
├── config/               # Configuration files
├── server.js             # Entry point
└── package.json
\`\`\`

## 🚀 Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Set up environment variables:
\`\`\`bash
cp .env.example .env
# Edit .env with your database credentials
\`\`\`

3. Create database:
\`\`\`bash
psql -U postgres
CREATE DATABASE skynest_db;
\q
\`\`\`

4. Run schema:
\`\`\`bash
psql -U postgres -d skynest_db -f database/schema.sql
\`\`\`

5. Seed database:
\`\`\`bash
npm run db:seed
\`\`\`

6. Start server:
\`\`\`bash
npm run dev
\`\`\`

Server runs on: http://localhost:4000

## 📡 API Endpoints

### Authentication
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/logout

### Admin
- GET /api/admin/users
- POST /api/admin/users
- GET /api/admin/employees
- POST /api/admin/employees

### Bookings
- GET /api/bookings
- POST /api/bookings
- PATCH /api/bookings/:id

### Services
- GET /api/services
- POST /api/services

### Reports
- GET /api/reports/revenue
- GET /api/reports/occupancy

## 🧪 Testing

Run tests:
\`\`\`bash
npm test
\`\`\`

## 🔒 Authentication

Uses JWT tokens. Include in requests as Authorization header.

## 👥 Roles

Admin, Manager, Receptionist, Accountant, Customer with different permissions.
"@

Set-Content -Path "backend\README.md" -Value $backendReadme

Write-Host "  ✅ Phase 6 Complete" -ForegroundColor Green
Write-Host ""

Write-Host "✨ Backend reorganization complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Update import paths in backend/src files" -ForegroundColor Gray
Write-Host "  2. Copy dependencies from root package.json to backend/package.json" -ForegroundColor Gray
Write-Host "  3. Test backend: cd backend && npm install && npm run dev" -ForegroundColor Gray
Write-Host ""
