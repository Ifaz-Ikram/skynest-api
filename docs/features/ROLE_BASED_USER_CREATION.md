# Role-Based User Creation System

## Overview
The SkyNest Hotel system now has a comprehensive role-based access control (RBAC) system for creating user accounts.

## User Types

### 1. **Customer Accounts** (Public Registration)
- **Who can create**: Anyone (public registration)
- **Endpoint**: `POST /api/auth/register`
- **Authentication**: Not required
- **Process**: 
  - Creates `user_account` with role='Customer'
  - Creates `guest` record with personal info
  - Creates `customer` linking record
  - Auto-login after registration

### 2. **Employee Accounts** (Admin/Manager Only)
- **Roles**: Admin, Manager, Receptionist, Accountant
- **Endpoint**: `POST /api/admin/employees`
- **Authentication**: Required (Bearer token)
- **Process**:
  - Creates `user_account` with specified role
  - Creates `guest` record with personal info
  - Creates `employee` linking record

## Permission Matrix

| Current Role  | Can Create Roles |
|--------------|------------------|
| **Admin**    | Admin, Manager, Receptionist, Accountant, Customer |
| **Manager**  | Receptionist, Accountant, Customer |
| **Receptionist** | Customer only (cannot create employees) |
| **Accountant** | None (cannot create users) |
| **Customer** | None (cannot create users) |

### Special Rules:
- ✅ **Admin** - Full access to create all roles including other Admins and Managers
- ✅ **Manager** - Can create Receptionist, Accountant, and Customer (NOT Admin, NOT Manager)
- ❌ **Receptionist** - Can only create Customer accounts (use public registration)
- ❌ **Accountant** - Can ONLY be created by Admin or Manager
- ❌ **Admin** - Can ONLY be created by existing Admin
- ❌ **Manager** - Can ONLY be created by Admin

## API Endpoints

### Public Registration (Customer Only)
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_customer",
  "password": "securepass123",
  "confirmPassword": "securepass123",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "user": {
    "user_id": 1,
    "username": "john_customer",
    "role": "Customer"
  }
}
```

### Employee Creation (Admin/Manager)
```http
POST /api/admin/employees
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "jane_receptionist",
  "password": "securepass123",
  "role": "Receptionist",
  "full_name": "Jane Smith",
  "email": "jane@skynest.com",
  "phone": "+0987654321",
  "address": "456 Hotel Ave"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Receptionist account created successfully",
  "user": {
    "user_id": 2,
    "username": "jane_receptionist",
    "role": "Receptionist",
    "guest_id": 2,
    "full_name": "Jane Smith"
  }
}
```

### Get Allowed Roles
```http
GET /api/admin/allowed-roles
Authorization: Bearer <token>
```

**Response (for Admin):**
```json
{
  "currentRole": "Admin",
  "allowedRoles": ["Admin", "Manager", "Receptionist", "Accountant"]
}
```

**Response (for Manager):**
```json
{
  "currentRole": "Manager",
  "allowedRoles": ["Receptionist", "Accountant"]
}
```

**Response (for Receptionist):**
```json
{
  "currentRole": "Receptionist",
  "allowedRoles": []
}
```

## Validation Rules

### Customer Registration
- ✅ Username: Required, unique
- ✅ Password: Minimum 6 characters, must match confirmation
- ✅ Email: Required, unique, valid format
- ✅ Full Name: Required
- ✅ Phone: Optional
- ✅ Address: Optional

### Employee Creation
- ✅ Username: Required, unique
- ✅ Password: Minimum 6 characters
- ✅ Role: Required, must be one of: Admin, Manager, Receptionist, Accountant
- ✅ Full Name: Required
- ✅ Email: Optional but unique if provided
- ✅ Phone: Optional
- ✅ Address: Optional
- ✅ Permission Check: Current user must have permission to create target role

## Error Responses

### 400 Bad Request
```json
{
  "error": "username, password, role, and full_name are required"
}
```

```json
{
  "error": "Password must be at least 6 characters"
}
```

```json
{
  "error": "Use the public registration endpoint for customer accounts"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "You don't have permission to create Admin accounts",
  "currentRole": "Manager",
  "attemptedRole": "Admin"
}
```

### 409 Conflict
```json
{
  "error": "Username already exists"
}
```

```json
{
  "error": "Email already exists"
}
```

## Database Schema

### Transaction Flow (Employee Creation)
```sql
BEGIN;

-- Step 1: Create guest record
INSERT INTO guest (full_name, email, phone, address)
VALUES ('Jane Smith', 'jane@skynest.com', '+0987654321', '456 Hotel Ave')
RETURNING guest_id;

-- Step 2: Create user account
INSERT INTO user_account (username, password_hash, role, guest_id)
VALUES ('jane_receptionist', '$2b$10$...', 'Receptionist', 2)
RETURNING user_id;

-- Step 3: Create employee record
INSERT INTO employee (user_id, guest_id)
VALUES (2, 2)
RETURNING employee_id;

COMMIT;
```

### Transaction Flow (Customer Registration)
```sql
BEGIN;

-- Step 1: Create guest record
INSERT INTO guest (full_name, email, phone, address)
VALUES ('John Doe', 'john@example.com', '+1234567890', '123 Main St')
RETURNING guest_id;

-- Step 2: Create user account
INSERT INTO user_account (username, password_hash, role, guest_id)
VALUES ('john_customer', '$2b$10$...', 'Customer', 1)
RETURNING user_id;

-- Step 3: Create customer record
INSERT INTO customer (user_id, guest_id)
VALUES (1, 1)
RETURNING customer_id;

COMMIT;
```

## Security Features

1. **Password Hashing**: bcrypt with 10 rounds
2. **Role Validation**: Enforced at controller level
3. **Permission Checks**: Matrix-based access control
4. **Transaction Safety**: Rollback on any error
5. **Uniqueness Checks**: Username and email validation
6. **Authentication Required**: Bearer token for employee creation

## Frontend Integration

### Customer Registration Form
- Available on login page ("Create Account" button)
- Public access (no authentication)
- Simplified form (only essential customer info)
- Auto-login after successful registration

### Employee Management (Admin/Manager)
- Protected section (requires authentication)
- Dynamic role dropdown based on current user's permissions
- GET `/api/admin/allowed-roles` to populate dropdown
- POST `/api/admin/employees` to create account
- Full employee information form

## Testing

### Test Customer Registration
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_customer",
    "password": "test123",
    "confirmPassword": "test123",
    "full_name": "Test Customer",
    "email": "test@customer.com",
    "phone": "+1111111111",
    "address": "Test Address"
  }'
```

### Test Employee Creation (as Admin)
```bash
# First login to get token
TOKEN=$(curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' \
  | jq -r '.token')

# Create employee
curl -X POST http://localhost:4000/api/admin/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "username": "new_manager",
    "password": "secure123",
    "role": "Manager",
    "full_name": "New Manager",
    "email": "manager@skynest.com",
    "phone": "+2222222222"
  }'
```

## Migration Notes

- **Backward Compatibility**: Legacy `/api/users` and `/api/admin/users` endpoints still work (Admin only)
- **New Endpoints**: Use `/api/admin/employees` for role-based employee creation
- **Public Registration**: Continues to work at `/api/auth/register` (Customer only)
- **No Breaking Changes**: Existing functionality preserved

## Summary

✅ **Public Registration** → Always creates Customer accounts only
✅ **Admin** → Can create anyone (including other Admins)
✅ **Manager** → Can create everyone except Admin
✅ **Receptionist** → Cannot create employees (Customer via public registration only)
✅ **Accountant** → Can only be created by Admin or Manager
✅ **Role-based Validation** → Enforced at API level
✅ **Transaction Safety** → All-or-nothing account creation
✅ **Security** → Password hashing, authentication, authorization
