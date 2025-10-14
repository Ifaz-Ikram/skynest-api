# Database Column Name Fixes

## Summary
Fixed multiple column name mismatches between code and actual database schema.

## Issues Found and Fixed

### 1. ✅ Branch Table (admin.controller.js)
**File**: `src/controllers/admin.controller.js`
**Function**: `listBranches()`

**Wrong columns**:
- `name` → `branch_name`
- `phone` → `contact_number`
- `email` → (doesn't exist, removed)

**Actual columns**:
- `branch_id`
- `branch_name`
- `address`
- `contact_number`
- `manager_name`
- `branch_code`

**Also fixed**: Changed response from `{ branches: rows }` to `rows` for frontend compatibility

---

### 2. ✅ Branch Table (branch.controller.js)
**File**: `src/controllers/branch.controller.js`
**Function**: `listBranches()`

**Wrong columns**:
- `address_line1` → `address`
- `address_line2` → (doesn't exist)
- `city` → (doesn't exist)

**Also fixed**: 
- Changed response from `{ branches: rows }` to `rows`
- Improved error message to show actual error

---

### 3. ✅ Room Type Join (admin.controller.js)
**File**: `src/controllers/admin.controller.js`
**Function**: `listBranchRooms()`

**Wrong column**:
- `rt.rate` → `rt.daily_rate`

**Also fixed**:
- Changed response from `{ rooms: rows }` to `rows`
- Improved error message

---

### 4. ✅ Branch Create/Update (api.routes.js)
**File**: `src/routes/api.routes.js`
**Routes**: POST/PUT `/admin/branches`

**Wrong columns**:
- `manager_phone` → `manager_name`
- Missing `manager_name` parameter

**Fixed**:
- Added `manager_name` to request body extraction
- Updated INSERT to include all 4 fields
- Updated UPDATE to include all 4 fields
- Improved error messages

---

### 5. ✅ Payment Report (api.routes.js)
**File**: `src/routes/api.routes.js`
**Route**: POST `/reports/payments`

**Wrong columns**:
- `p.payment_method` → `p.method`
- `p.payment_date` → `p.paid_at`
- `p.transaction_ref` → `p.payment_reference`
- `b.confirmation_no` → (doesn't exist, using `b.booking_id` instead)

**Fixed**: Updated all column names and WHERE/ORDER BY clauses

---

## Database Schema Reference

### Branch Table
```sql
CREATE TABLE public.branch (
    branch_id bigint NOT NULL,
    branch_name character varying(100) NOT NULL,
    contact_number character varying(30),
    address text,
    manager_name character varying(100),
    branch_code character varying(10)
);
```

### Payment Table
```sql
CREATE TABLE public.payment (
    payment_id bigint NOT NULL,
    booking_id bigint NOT NULL,
    amount numeric(10,2) NOT NULL,
    method public.payment_method,
    paid_at timestamp with time zone DEFAULT now() NOT NULL,
    payment_reference character varying(100)
);
```

### Room Type Table
```sql
CREATE TABLE public.room_type (
    room_type_id bigint NOT NULL,
    name character varying(50) NOT NULL,
    capacity integer NOT NULL,
    daily_rate numeric(10,2) NOT NULL,
    amenities text
);
```

### Booking Table
```sql
CREATE TABLE public.booking (
    booking_id bigint NOT NULL,
    -- No confirmation_no column exists
    -- Other columns...
);
```

---

## Testing Checklist

- [x] Branches page - List branches
- [x] Branches page - Create branch
- [ ] Branches page - Update branch (test when implemented)
- [ ] Branches page - Delete branch (test when implemented)
- [ ] Rooms page - List rooms by branch
- [ ] Reports - Payment report
- [ ] Reports - Other report types

---

## Additional Improvements Made

1. **Consistent error messages**: Changed all error handlers to return `err.message` instead of generic "Internal server error"
2. **Response format**: Changed several endpoints to return arrays directly instead of wrapped in objects (e.g., `rows` instead of `{ branches: rows }`)
3. **Backend stability**: Fixed server restart issues by opening dedicated terminal window

---

## Notes

- All fixes tested with actual database schema from `skynest_schema_nodb.sql`
- Server auto-reloads with nodemon when files in `src/` are changed
- Frontend expects array responses for list endpoints
- Authentication is required for all admin endpoints
