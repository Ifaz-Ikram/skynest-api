# 🏨 SkyNest Hotel Management System

A full-stack hotel reservation and guest services management system with role-based access control.

[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)

## 📁 Project Structure

```
skynest-api/
├── backend/              # Node.js/Express API
│   ├── src/             # Application source code
│   ├── database/        # Schema & seeds
│   ├── scripts/         # Utility scripts
│   ├── tests/           # API tests
│   └── README.md        # Backend documentation
├── frontend/            # React + Vite UI
│   ├── src/            # React components
│   └── README.md       # Frontend documentation
├── docs/               # Project documentation
│   ├── setup/         # Setup guides
│   ├── features/      # Feature documentation
│   └── fixes/         # Bug fix documentation
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Development Mode
**Terminal 1 - Backend:**
```powershell
cd backend
npm install
npm run dev
```
Server: http://localhost:4000

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm install
npm run dev
```
Frontend: http://localhost:5173

### Database Setup
```bash
# Create database
psql -U postgres
CREATE DATABASE skynest;
\q

# Run schema
cd backend
psql -U postgres -d skynest -f database/schema.sql

# Seed demo data
npm run db:seed:demo
```

### Default Login
- Username: `admin`
- Password: `admin123`

## 🎯 Features

- ✅ **User Authentication** - JWT-based login/logout
- ✅ **Role-Based Access Control** - Admin, Manager, Receptionist, Accountant, Customer
- ✅ **Room Booking Management** - Create, view, update bookings
- ✅ **Service Management** - Laundry, room service, spa services
- ✅ **Payment Processing** - Track and manage payments
- ✅ **Invoice Generation** - Automated billing
- ✅ **Pre-booking System** - Pre-booking codes for customers
- ✅ **Customer Registration** - Public customer signup
- ✅ **Audit Logging** - Track all system activities

## 📊 Tech Stack

**Backend**: Node.js, Express 5, PostgreSQL, Sequelize, JWT  
**Frontend**: React 18, Vite, Tailwind CSS, date-fns

## 📚 Documentation

- **Backend API**: [backend/README.md](backend/README.md)
- **Frontend**: [frontend/README.md](frontend/README.md)
- **Database Schema**: [docs/README_DB.md](docs/README_DB.md)
- **Setup Guides**: [docs/setup/](docs/setup/)
- **Features**: [docs/features/](docs/features/)

## 🛠️ Development Commands

**Backend:**
```bash
cd backend
npm run dev          # Start dev server
npm test             # Run tests
npm run db:reset     # Reset database
```

**Frontend:**
```bash
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
```

## 🔐 User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access |
| **Manager** | Create Receptionist/Accountant, reports |
| **Receptionist** | Bookings, check-ins, customers |
| **Accountant** | Payments, invoices, financials |
| **Customer** | View/create own bookings |

## 📝 License

ISC

---

**Built with ❤️ for efficient hotel management**
