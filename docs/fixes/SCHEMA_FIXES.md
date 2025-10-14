# 🎯 Database Schema Fixes Applied

## Issues Found & Fixed

### 1. Branch Table
- ❌ Old: `name`, `address`, `phone`, `email`
- ✅ Fixed: `branch_name`, `contact_number`, `address`, `manager_name`, `branch_code`

### 2. Room Type Table  
- ❌ Old: `rate`
- ✅ Fixed: `daily_rate`
- ❌ Old: included `branch_id`
- ✅ Fixed: removed `branch_id` (only in room table)

### 3. Guest Table
- ❌ Old: `first_name`, `last_name`, `id_number`
- ✅ Fixed: `full_name`, `nic`, `gender`, `nationality`, `date_of_birth`

### 4. Employee Table
- ❌ Old: `role`, `phone`
- ✅ Fixed: `user_id`, `contact_no` (role comes from user_account)

### 5. User Account Relationships
- ✅ Fixed: `user_account` → `guest_id` FK
- ✅ Fixed: `employee` → `user_id` FK  
- ✅ Fixed: `customer` → `user_id` + `guest_id` FK

### 6. Database Constraints
- ✅ Fixed: Delete order (user_account before guest due to FK)
- 🔧 TODO: Fix advance_payment validation (must be ≥10% of room charges)

## Next Steps

Run this to see booking validation error:
```bash
npm run db:reset
```

The seed script now successfully creates:
- ✅ 5 users (all roles)
- ✅ 1 branch
- ✅ 3 room types
- ✅ 9 rooms
- ✅ 1 guest
- ✅ 1 employee
- ✅ 5 services

**Remaining issue**: Booking creation fails due to advance_payment validation constraint requiring ≥10% of total room charges.

To fix: Update booking creation in `seeds/demo-data.js` to calculate and provide proper advance_payment amounts.
