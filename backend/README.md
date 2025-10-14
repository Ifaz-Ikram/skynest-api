# SkyNest Backend API

Backend REST API for SkyNest Hotel Management System.

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/      # Request handlers
│   ├── routes/           # API routes
│   ├── middleware/       # Auth, validation, RBAC
│   ├── models/           # Sequelize models
│   ├── utils/            # Helper functions
│   ├── schemas/          # Zod validation schemas
│   ├── db/               # Database connection
│   └── app.js            # Express app configuration
├── database/
│   ├── schema.sql        # PostgreSQL schema
│   └── seeds/            # Seed data scripts
├── scripts/              # Utility scripts
├── tests/                # Jest API tests
├── config/               # Configuration files
├── server.js             # Entry point
├── package.json
└── .env                  # Environment variables
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Set Up Database
```bash
# Create database in PostgreSQL
psql -U postgres
CREATE DATABASE skynest;
\q

# Run schema
psql -U postgres -d skynest -f database/schema.sql
```

### 3. Configure Environment
Update `.env` with your database credentials:
```env
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=skynest
PGUSER=postgres
PGPASSWORD=your_password
JWT_SECRET=your-secret-key
```

### 4. Seed Database
```bash
npm run db:seed:demo
```

### 5. Start Server
```bash
npm run dev
```

Server runs on: **http://localhost:4000**

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Customer registration
- `POST /api/auth/logout` - User logout

### Admin
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user (Admin/Manager)
- `GET /api/admin/employees` - List employees
- `POST /api/admin/employees` - Create employee

### Bookings
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details
- `PATCH /api/bookings/:id` - Update booking

### Services
- `GET /api/services` - List services
- `POST /api/services` - Create service
- `GET /api/services/:id` - Get service details

### Payments
- `GET /api/payments` - List payments
- `POST /api/payments` - Create payment

### Reports
- `GET /api/reports/revenue` - Revenue report
- `GET /api/reports/occupancy` - Occupancy report
- `GET /api/reports/services` - Services report

## 🔒 Authentication

Uses JWT Bearer tokens. Include in request headers:
```
Authorization: Bearer <your-token>
```

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access, create any user |
| **Manager** | Create Receptionist/Accountant, view reports |
| **Receptionist** | Manage bookings, customers |
| **Accountant** | Manage payments, invoices |
| **Customer** | View own bookings, make bookings |

## 🧪 Testing

Run all tests:
```bash
npm test
```

Run specific test:
```bash
npm test auth.test.js
```

## 📝 Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run Jest tests
- `npm run db:seed` - Seed database with sample data
- `npm run db:clean` - Clean database
- `npm run db:reset` - Clean and reseed database
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## 🗄️ Database Models

- **User** - System users and customers
- **Employee** - Employee details
- **Customer** - Customer information
- **Booking** - Room bookings
- **Payment** - Payment records
- **Service** - Hotel services
- **ServiceUsage** - Service usage tracking

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express 5
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT + bcryptjs
- **Validation**: Zod + express-validator
- **Testing**: Jest + Supertest
- **Security**: Helmet, CORS

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 4000 |
| `NODE_ENV` | Environment | development |
| `PGHOST` | PostgreSQL host | 127.0.0.1 |
| `PGPORT` | PostgreSQL port | 5432 |
| `PGDATABASE` | Database name | skynest |
| `PGUSER` | Database user | postgres |
| `PGPASSWORD` | Database password | - |
| `JWT_SECRET` | JWT signing key | change-me |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |

## 🐛 Troubleshooting

### Database connection fails
- Ensure PostgreSQL is running
- Verify credentials in `.env`
- Check database exists: `psql -U postgres -l`

### JWT authentication fails
- Ensure `JWT_SECRET` is set in `.env`
- Check token format in Authorization header

### Tests fail
- Run `npm run db:reset` to reset test data
- Ensure test database is clean

## 📚 Documentation

See `/docs` folder for:
- API documentation
- Database schema details
- Development guides
