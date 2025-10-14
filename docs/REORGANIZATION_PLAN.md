# SkyNest Hotel - Project Reorganization Plan

## 🎯 Goal
Restructure the project into a clean, professional, and maintainable structure similar to MedSync, with separate frontend and backend folders.

## 📊 Current Structure Issues
- ❌ Mixed frontend/backend files in root directory
- ❌ Too many documentation files in root
- ❌ Unclear separation of concerns
- ❌ Difficult to navigate and understand
- ❌ `src/`, `server/`, `frontend/` all at root level

## ✅ Proposed New Structure

```
skynest-hotel/
├── backend/                          # Backend API Server
│   ├── src/
│   │   ├── config/                   # Configuration files
│   │   │   ├── database.js           # Database connection
│   │   │   └── jwt.js                # JWT configuration
│   │   ├── controllers/              # Request handlers
│   │   │   ├── auth.controller.js
│   │   │   ├── admin.controller.js
│   │   │   ├── booking.controller.js
│   │   │   ├── payment.controller.js
│   │   │   ├── service.controller.js
│   │   │   ├── report.controller.js
│   │   │   ├── prebooking.controller.js
│   │   │   ├── invoice.controller.js
│   │   │   └── branch.controller.js
│   │   ├── middleware/               # Express middleware
│   │   │   ├── auth.js               # Authentication
│   │   │   ├── rbac.js               # Role-based access
│   │   │   ├── validate.js           # Validation
│   │   │   └── validateRequest.js
│   │   ├── routes/                   # API route definitions
│   │   │   ├── auth.routes.js
│   │   │   ├── admin.routes.js
│   │   │   ├── booking.routes.js
│   │   │   ├── payment.routes.js
│   │   │   ├── service.routes.js
│   │   │   ├── report.routes.js
│   │   │   ├── branch.routes.js
│   │   │   ├── catalog.routes.js
│   │   │   ├── secure.routes.js
│   │   │   └── api.routes.js         # Main API router
│   │   ├── schemas/                  # Zod validation schemas
│   │   │   ├── auth.schema.js
│   │   │   ├── bookings.schema.js
│   │   │   ├── payments.schema.js
│   │   │   └── services.schema.js
│   │   ├── utils/                    # Utility functions
│   │   │   ├── dates.js
│   │   │   ├── email.js
│   │   │   ├── money.js
│   │   │   ├── passwords.js
│   │   │   ├── roles.js
│   │   │   └── totals.js
│   │   ├── models/                   # Sequelize models (if using)
│   │   │   ├── Booking.js
│   │   │   ├── Customer.js
│   │   │   ├── Employee.js
│   │   │   ├── Payment.js
│   │   │   ├── ServiceUsage.js
│   │   │   ├── UserAccount.js
│   │   │   └── index.js
│   │   └── app.js                    # Express app setup
│   ├── database/                     # Database files
│   │   ├── schema.sql                # PostgreSQL schema
│   │   └── seeds/                    # Seed data scripts
│   │       ├── demo-data.js
│   │       ├── sample-data.js
│   │       ├── test-users.js
│   │       └── index.js
│   ├── scripts/                      # Utility scripts
│   │   ├── clean-db.js
│   │   ├── hooks-install.js
│   │   └── scheduled-tasks.js
│   ├── tests/                        # Backend tests
│   │   ├── _helpers/
│   │   │   └── setup.js
│   │   ├── auth.test.js
│   │   ├── bookings.test.js
│   │   ├── payments.test.js
│   │   ├── services.test.js
│   │   └── reports.test.js
│   ├── .env                          # Environment variables
│   ├── .env.example                  # Example environment config
│   ├── .gitignore                    # Git ignore rules
│   ├── server.js                     # Server entry point
│   ├── package.json                  # Backend dependencies
│   ├── package-lock.json
│   ├── nodemon.json                  # Nodemon configuration
│   └── eslint.config.mjs             # ESLint configuration
│
├── frontend/                         # React Frontend
│   ├── src/
│   │   ├── components/               # React components
│   │   │   ├── common/               # Shared components
│   │   │   │   ├── StatsCard.jsx
│   │   │   │   ├── LoadingSpinner.jsx
│   │   │   │   ├── ErrorBoundary.jsx
│   │   │   │   └── Toast.jsx
│   │   │   ├── auth/                 # Authentication
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── RegistrationModal.jsx
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── layout/               # Layout components
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── Footer.jsx
│   │   │   ├── dashboard/            # Dashboard
│   │   │   │   └── Dashboard.jsx
│   │   │   ├── bookings/             # Bookings
│   │   │   │   ├── BookingsPage.jsx
│   │   │   │   ├── CreateBookingModal.jsx
│   │   │   │   └── BookingDetailsModal.jsx
│   │   │   ├── rooms/                # Rooms
│   │   │   │   └── RoomsPage.jsx
│   │   │   ├── services/             # Services
│   │   │   │   └── ServicesPage.jsx
│   │   │   ├── payments/             # Payments
│   │   │   │   ├── PaymentsPage.jsx
│   │   │   │   ├── CreatePaymentModal.jsx
│   │   │   │   └── PaymentAdjustmentModal.jsx
│   │   │   ├── reports/              # Reports
│   │   │   │   └── ReportsPage.jsx
│   │   │   ├── users/                # User Management
│   │   │   │   ├── UsersPage.jsx
│   │   │   │   └── CreateUserModal.jsx
│   │   │   ├── branches/             # Branches
│   │   │   │   ├── BranchesPage.jsx
│   │   │   │   └── BranchModal.jsx
│   │   │   ├── guests/               # Guests
│   │   │   │   ├── GuestsPage.jsx
│   │   │   │   └── GuestModal.jsx
│   │   │   ├── prebookings/          # Pre-bookings
│   │   │   │   ├── PreBookingsPage.jsx
│   │   │   │   └── PreBookingModal.jsx
│   │   │   ├── invoices/             # Invoices
│   │   │   │   ├── InvoicesPage.jsx
│   │   │   │   └── InvoiceModal.jsx
│   │   │   └── audit/                # Audit Log
│   │   │       └── AuditLogPage.jsx
│   │   ├── lib/                      # Utilities and helpers
│   │   │   ├── api.js                # API client
│   │   │   ├── fmt.js                # Formatters
│   │   │   └── toast.jsx             # Toast notifications
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useBookings.js
│   │   │   └── useApi.js
│   │   ├── context/                  # React Context
│   │   │   └── AuthContext.jsx
│   │   ├── App.jsx                   # Main app component
│   │   ├── main.jsx                  # App entry point
│   │   ├── index.css                 # Global styles
│   │   └── styles.css                # Additional styles
│   ├── public/                       # Static assets
│   │   └── index.html
│   ├── package.json                  # Frontend dependencies
│   ├── package-lock.json
│   ├── vite.config.js                # Vite configuration
│   ├── tailwind.config.js            # Tailwind configuration
│   ├── postcss.config.js             # PostCSS configuration
│   └── README.md                     # Frontend documentation
│
├── docs/                             # Documentation
│   ├── api/                          # API documentation
│   │   ├── authentication.md
│   │   ├── bookings.md
│   │   ├── payments.md
│   │   └── reports.md
│   ├── database/                     # Database documentation
│   │   ├── schema.md
│   │   ├── relationships.md
│   │   └── setup.md
│   ├── deployment/                   # Deployment guides
│   │   ├── production.md
│   │   └── docker.md
│   ├── development/                  # Development guides
│   │   ├── getting-started.md
│   │   ├── coding-standards.md
│   │   └── testing.md
│   └── features/                     # Feature documentation
│       ├── role-based-access.md
│       ├── employee-management.md
│       └── audit-logging.md
│
├── .git/                             # Git repository
├── .github/                          # GitHub workflows
├── .gitignore                        # Root git ignore
├── docker-compose.yml                # Docker compose config
├── README.md                         # Main project README
├── CONTRIBUTING.md                   # Contribution guidelines
├── LICENSE                           # License file
└── CHANGELOG.md                      # Version changelog
```

---

## 📝 Migration Steps

### Phase 1: Create New Structure
1. Create `backend/` directory
2. Create `frontend/` directory (already exists, just move)
3. Create `docs/` directory
4. Create subdirectories inside each

### Phase 2: Move Backend Files
1. Move `src/` → `backend/src/`
2. Move `models/` → `backend/src/models/`
3. Move `server.js` → `backend/server.js`
4. Move `server/` contents → `backend/src/` (merge)
5. Move `.env`, `.env.example` → `backend/`
6. Move `package.json`, `package-lock.json` → `backend/`
7. Move `nodemon.json` → `backend/`
8. Move `eslint.config.mjs` → `backend/`
9. Create `backend/src/app.js` (extract from server.js)

### Phase 3: Reorganize Database
1. Create `backend/database/` directory
2. Move `skynest_schema_nodb.sql` → `backend/database/schema.sql`
3. Create `backend/database/seeds/` directory
4. Move `seeds/*` → `backend/database/seeds/`

### Phase 4: Move Scripts & Tests
1. Move `scripts/` → `backend/scripts/`
2. Move `tests/` → `backend/tests/`
3. Move utility scripts → `backend/scripts/`

### Phase 5: Reorganize Frontend (already in frontend/)
1. Create subdirectories in `frontend/src/components/`
2. Split `App.jsx` into smaller components
3. Create `frontend/src/lib/` for utilities
4. Create `frontend/src/hooks/` for custom hooks
5. Create `frontend/src/context/` for context providers

### Phase 6: Move Documentation
1. Create `docs/` directory
2. Move all `.md` files to appropriate `docs/` subdirectories:
   - API docs → `docs/api/`
   - Database docs → `docs/database/`
   - Feature docs → `docs/features/`
   - Development docs → `docs/development/`
3. Keep only essential docs in root:
   - `README.md`
   - `CONTRIBUTING.md`
   - `LICENSE`
   - `CHANGELOG.md`

### Phase 7: Update Configurations
1. Update import paths in all files
2. Update `package.json` scripts
3. Update `.gitignore` files
4. Update `docker-compose.yml` paths
5. Create `backend/src/config/` directory
6. Extract configuration from `server.js`

### Phase 8: Create Missing Files
1. Create `backend/src/app.js` (Express app)
2. Create `backend/src/config/database.js`
3. Create `backend/src/config/jwt.js`
4. Create `frontend/src/context/AuthContext.jsx`
5. Create `frontend/src/hooks/useAuth.js`
6. Create `README.md` files for each major directory

---

## 🎯 Benefits of New Structure

### Backend
✅ **Clear separation** - Config, controllers, routes, middleware all separated  
✅ **Scalable** - Easy to add new features without clutter  
✅ **Testable** - Tests organized alongside code  
✅ **Standard** - Follows industry best practices  

### Frontend
✅ **Component organization** - Features grouped by domain  
✅ **Reusable** - Common components separated  
✅ **Maintainable** - Easy to find and update components  
✅ **Scalable** - Can grow without becoming messy  

### Documentation
✅ **Organized** - Docs grouped by category  
✅ **Accessible** - Easy to find relevant documentation  
✅ **Clean root** - No documentation clutter in root  

---

## 🚀 Quick Start After Reorganization

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your settings
node scripts/clean-db.js
node database/seeds/index.js
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Both
```bash
# From root directory
docker-compose up
```

---

## 📋 Checklist

### Backend
- [ ] Create `backend/` directory structure
- [ ] Move all backend files
- [ ] Update import paths
- [ ] Create `backend/src/config/`
- [ ] Create `backend/src/app.js`
- [ ] Update `package.json` scripts
- [ ] Test backend starts correctly
- [ ] Test all API endpoints work

### Frontend
- [ ] Create component subdirectories
- [ ] Split App.jsx into smaller components
- [ ] Create `lib/`, `hooks/`, `context/` directories
- [ ] Move utilities to `lib/`
- [ ] Create custom hooks
- [ ] Create AuthContext
- [ ] Update import paths
- [ ] Test frontend runs correctly

### Documentation
- [ ] Create `docs/` structure
- [ ] Move all markdown files
- [ ] Create category subdirectories
- [ ] Update links in README
- [ ] Create index files

### Configuration
- [ ] Update `.gitignore`
- [ ] Update `docker-compose.yml`
- [ ] Create backend `.env.example`
- [ ] Update all relative paths
- [ ] Test deployment

---

## 🔄 Rollback Plan

If something goes wrong:
1. Keep a backup of current structure
2. Git commit before each phase
3. Can revert using: `git reset --hard HEAD~1`

---

## 📚 Reference Projects

This structure is based on:
- **MedSync** - Hospital management system
- **MERN Stack Best Practices**
- **Node.js Project Structure Guidelines**
- **React Component Organization Patterns**

---

**Status:** 📋 **PLANNING PHASE**  
**Next Step:** Review plan and approve before execution

Would you like me to proceed with the reorganization?
