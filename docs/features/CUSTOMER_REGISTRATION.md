# Customer Registration Feature

## Overview
New customers can now create their own accounts through a self-registration system. This allows them to book rooms and use the system for future reservations.

## Features

### Frontend Changes

1. **Registration Modal** (`RegistrationModal` component)
   - Clean, modern modal interface
   - Form validation (password matching, minimum length)
   - Comprehensive customer information collection:
     - Account: username, password
     - Personal: full name, email, phone, address
     - Identification: ID proof type and number
   - Real-time error display
   - Loading states

2. **Login Page Update**
   - Added "Don't have an account? Create Account" link
   - Opens registration modal on click
   - Auto-fills login form with new credentials after successful registration

3. **API Method**
   - `api.register(registrationData)` - Handles registration requests

### Backend Changes

1. **Registration Controller** (`auth.controller.js`)
   - `register()` function with:
     - Input validation (required fields, password length, email format)
     - Username uniqueness check
     - Email uniqueness check
     - Password hashing with bcrypt
     - Transaction-based user creation:
       1. Create `user_account` with role 'Customer'
       2. Create `guest` record with personal info
       3. Link with `customer` record
     - Automatic rollback on errors

2. **Registration Route** (`auth.routes.js`)
   - `POST /api/auth/register` - Public endpoint for registration

## User Flow

1. **Access Registration**
   - User clicks "Create Account" link on login page
   - Registration modal opens

2. **Fill Registration Form**
   - Account Information:
     - Username (unique)
     - Password (min 6 characters)
     - Confirm Password
   - Personal Information:
     - Full Name
     - Email (unique)
     - Phone
     - Address (optional)
   - Identification:
     - ID Proof Type (Passport, Driver License, National ID, Other)
     - ID Proof Number

3. **Submit Registration**
   - Frontend validates password match and length
   - Backend validates:
     - All required fields present
     - Username doesn't exist
     - Email doesn't exist
   - Creates user account with Customer role
   - Creates guest profile
   - Links them as a customer

4. **After Registration**
   - Modal closes
   - Username and password auto-filled in login form
   - User can immediately login
   - Success message displayed

## Database Schema

The registration creates records in three tables:

```sql
-- 1. user_account
user_id (auto-generated)
username (from form)
password_hash (bcrypt hashed)
role = 'Customer'
is_active = true

-- 2. guest
guest_id (auto-generated)
full_name (from form)
email (from form)
phone (from form)
address (from form, optional)
id_proof_type (from form)
id_proof_number (from form)

-- 3. customer
customer_id (auto-generated)
user_id (links to user_account)
guest_id (links to guest)
```

## Validation Rules

### Frontend
- Username: Required, non-empty
- Password: Required, minimum 6 characters
- Confirm Password: Must match password
- Full Name: Required
- Email: Required, valid email format
- Phone: Required
- ID Proof Type: Required, dropdown selection
- ID Proof Number: Required
- Address: Optional

### Backend
- All required fields must be present
- Password minimum 6 characters
- Username must be unique
- Email must be unique
- Uses database constraints for data integrity

## Error Handling

### Common Errors
- "Username already exists" - Username taken
- "Email already registered" - Email in use
- "Passwords do not match" - Frontend validation
- "Password must be at least 6 characters" - Password too short
- "Missing required fields" - Incomplete form
- "Failed to create account" - Server error

### Transaction Safety
- All database operations wrapped in transaction
- Automatic rollback on any error
- Ensures data consistency (no orphaned records)

## Security Features

1. **Password Security**
   - Bcrypt hashing (10 rounds)
   - Never stored in plain text
   - Minimum length requirement

2. **Data Validation**
   - Server-side validation
   - SQL injection prevention (parameterized queries)
   - Uniqueness constraints

3. **Error Messages**
   - Generic messages to prevent user enumeration
   - Detailed logging on server

## Testing

### Test New Registration
1. Open login page
2. Click "Create Account"
3. Fill in all required fields:
   - Username: `newcustomer`
   - Password: `customer123`
   - Confirm: `customer123`
   - Name: `Jane Smith`
   - Email: `jane@example.com`
   - Phone: `+1 555 123 4567`
   - ID Type: Passport
   - ID Number: `AB1234567`
4. Click "Create Account"
5. Should auto-fill login form
6. Login successfully
7. Verify Customer role access

### Test Validations
- Try duplicate username
- Try duplicate email
- Try short password
- Try mismatched passwords
- Try missing required fields

## Future Enhancements

Potential improvements:
- Email verification
- Phone number verification
- CAPTCHA for bot prevention
- Password strength indicator
- Profile picture upload
- Terms and conditions checkbox
- Welcome email after registration
- Email format validation (regex)
- Phone format validation
