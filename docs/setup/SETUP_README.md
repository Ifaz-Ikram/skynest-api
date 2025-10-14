# SkyNest Hotel Management System

A full-featured hotel management web application with role-based access control (RBAC), built with Node.js/Express, PostgreSQL, and React.

## 🎯 Features

- **Role-Based Access Control**: 5 distinct roles (Admin, Manager, Receptionist, Accountant, Customer)
- **Booking Management**: Create, update, track bookings with room overlap detection
- **Service Management**: Service catalog, usage tracking, automatic pricing
- **Payment Processing**: Multiple payment methods, adjustments, refunds
- **Financial Reporting**: Occupancy, revenue, balances due, payment ledgers
- **Customer Dashboard**: View bookings, services, payments, balances
- **Staff Dashboards**: Role-specific views for hotel operations

## 📋 Prerequisites

- **Node.js** 14+ and npm
- **PostgreSQL** 12+
- **Git** (optional)

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repository-url>
cd skynest-api
npm install
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
createdb skynest_db
```

Run the schema (if not already done):

```bash
psql -d skynest_db -f skynest_schema_nodb.sql
```

### 3. Environment Configuration

Create a `.env` file in the project root:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=skynest_db

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secret (change in production!)
JWT_SECRET=your_super_secret_jwt_key_change_this

# Frontend Build (optional)
USE_REACT_BUILD=false
```

### 4. Seed Demo Data

Run the comprehensive seed script to create demo users, branches, rooms, bookings, services, and payments:

```bash
node seeds/demo-data.js
```

This creates:
- **5 users** (one per role: admin, manager, receptionist, accountant, customer)
- **1 branch** (SkyNest Headquarters)
- **3 room types** (Standard, Deluxe, Suite) with 3 rooms each (9 total)
- **1 guest** (linked to customer user)
- **5 services** (Laundry, Breakfast, Mini Bar, Spa, Airport Transfer)
- **3 bookings** (upcoming, current, past) with services and payments

### 5. Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

Server runs at: **http://localhost:3000**

### 6. Login Credentials

After seeding, use these credentials:

| Role          | Username      | Password       |
|---------------|---------------|----------------|
| Admin         | `admin`       | `admin123`     |
| Manager       | `manager`     | `manager123`   |
| Receptionist  | `receptionist`| `receptionist123` |
| Accountant    | `accountant`  | `accountant123`|
| Customer      | `customer`    | `customer123`  |

## 📁 Project Structure

```
skynest-api/
├── src/
│   ├── controllers/       # Request handlers
│   │   ├── auth.controller.js
│   │   ├── booking.controller.js
│   │   ├── service-payment.controller.js
│   │   ├── prebooking.controller.js
│   │   ├── admin.controller.js
│   │   └── report.controller.js
│   ├── middleware/        # Auth & RBAC middleware
│   │   ├── auth.js
│   │   ├── rbac.js
│   │   └── validate.js
│   ├── routes/            # API route definitions
│   │   └── api.routes.js  # Comprehensive API routes
│   ├── utils/             # Utility functions
│   │   ├── money.js       # Money formatting (2 decimals)
│   │   ├── dates.js       # Date utilities
│   │   └── totals.js      # Billing calculations
│   ├── db/                # Database connection
│   │   └── index.js
│   ├── app.js             # Express app setup
│   └── public/            # Static frontend files
├── frontend/              # React frontend (Vite)
│   ├── src/
│   │   ├── main.jsx       # React app entry
│   │   ├── lib/
│   │   │   ├── api.js     # API client
│   │   │   ├── fmt.js     # Formatting utilities
│   │   │   └── toast.jsx  # Toast notifications
│   │   └── styles.css
│   ├── index.html
│   └── package.json
├── seeds/                 # Database seed scripts
│   └── demo-data.js       # Comprehensive demo data
├── tests/                 # API tests
├── skynest_schema_nodb.sql  # Database schema
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/login` - Login (public)
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user

### Bookings
- `GET /bookings` - List bookings (filtered by role)
- `GET /bookings/:id` - Get booking details
- `POST /bookings` - Create booking (Receptionist/Manager)
- `PATCH /bookings/:id/status` - Update status (Receptionist/Manager)
- `GET /bookings/rooms/free` - List available rooms
- `GET /bookings/rooms/:roomId/availability` - Check room availability

### Services
- `GET /service-catalog` - List service catalog
- `GET /bookings/:id/services` - Get booking services
- `POST /service-usage` - Add service to booking (Receptionist/Manager)

### Payments
- `GET /bookings/:id/payments` - Get booking payments
- `POST /payments` - Create payment (Receptionist/Accountant/Manager)
- `GET /bookings/:id/adjustments` - Get booking adjustments
- `POST /payment-adjustments` - Create adjustment (Manager/Accountant)

### Reports (Staff only)
- `GET /reports/occupancy-by-day` - Daily occupancy
- `GET /reports/billing-summary` - Billing summary
- `GET /reports/service-usage-detail` - Service usage details
- `GET /reports/payments-ledger` - Payment ledger
- `GET /reports/adjustments` - Adjustments log

### Admin (Admin only)
- `GET /admin/users` - List users
- `POST /admin/users` - Create user
- `PATCH /admin/users/:id/role` - Update user role
- `DELETE /admin/users/:id` - Delete user
- `POST /admin/service-catalog` - Create service
- `PUT /admin/service-catalog/:id` - Update service
- `DELETE /admin/service-catalog/:id` - Delete service

## 🧮 Billing Calculation

The system implements precise billing calculations with 2-decimal precision:

```javascript
1. room_subtotal = nights × booked_rate
2. services_subtotal = SUM(quantity × unit_price_at_use)
3. pre_tax_total = room_subtotal + services_subtotal - discount + late_fee
4. tax_amount = pre_tax_total × (tax_rate_percent / 100)
5. gross_total = pre_tax_total + tax_amount
6. balance = gross_total - (total_payments + advance_payment) + total_adjustments
```

All amounts are formatted to 2 decimal places.

## 🛡️ Role Permissions

| Feature                | Admin | Manager | Receptionist | Accountant | Customer |
|------------------------|-------|---------|--------------|------------|----------|
| View own bookings      | ✅    | ✅      | ✅           | ✅         | ✅       |
| View all bookings      | ✅    | ✅      | ✅           | ✅         | ❌       |
| Create booking         | ✅    | ✅      | ✅           | ❌         | ❌       |
| Update booking status  | ✅    | ✅      | ✅           | ❌         | ❌       |
| Add services           | ✅    | ✅      | ✅           | ❌         | ❌       |
| Create payment         | ✅    | ✅      | ✅           | ✅         | ❌       |
| Create adjustment      | ✅    | ✅      | ❌           | ✅         | ❌       |
| View reports           | ✅    | ✅      | ✅           | ✅         | ❌       |
| Manage users           | ✅    | ❌      | ❌           | ❌         | ❌       |
| Manage service catalog | ✅    | ❌      | ❌           | ❌         | ❌       |

## 🧪 Testing

Run API tests:

```bash
npm test
```

## 🎨 Frontend Development

The React frontend is located in the `frontend/` directory.

### Build Frontend

```bash
cd frontend
npm install
npm run build
```

The build output goes to `frontend/dist/`. Set `USE_REACT_BUILD=true` in `.env` to serve the React build.

### Development

```bash
cd frontend
npm run dev
```

Frontend dev server runs at: **http://localhost:5173**

## 📝 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `node seeds/demo-data.js` - Seed database with demo data

## 🔒 Security Notes

- Change `JWT_SECRET` in production
- Use strong database passwords
- Enable HTTPS in production
- Implement rate limiting
- Validate all user inputs
- Use environment variables for sensitive data

## 🐛 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check credentials in `.env`
- Ensure database exists: `psql -l`

### Seed Data Fails
- Check database schema is loaded
- Verify no constraint conflicts
- Run: `psql -d skynest_db -c "SELECT COUNT(*) FROM user_account;"`

### Port Already in Use
- Change `PORT` in `.env`
- Or kill process: `lsof -ti:3000 | xargs kill`

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [React Documentation](https://react.dev/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## 📄 License

MIT

## 👥 Contributors

Your team members here

---

**Built with ❤️ for modern hotel management**
