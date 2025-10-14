# Guest ID Management - Simplified Schema

**Date:** October 14, 2025  
**Status:** ✅ COMPLETE  
**Commit:** afc5835

## 🎯 Final Implementation

### ID Types Available (Dropdown Options)
1. **NIC** (National Identity Card) - For Sri Lankan citizens
2. **Passport** - For international guests
3. **Driving License** - Alternative ID option

## 📊 Database Schema

### Guest Table Structure
```sql
CREATE TABLE public.guest (
    guest_id bigint NOT NULL,
    full_name character varying(120) NOT NULL,
    email character varying(150),
    phone character varying(30),
    gender character varying(20),
    date_of_birth date,
    address text,
    nationality character varying(80),
    id_proof_type character varying(50),    -- NIC, Passport, or Driving License
    id_proof_number character varying(50)   -- The ID number
);
```

### What Changed
- ❌ **REMOVED:** `nic` column (separate field)
- ✅ **KEPT:** `id_proof_type` and `id_proof_number` (unified approach)
- ✅ **MIGRATED:** Existing NIC data automatically migrated to `id_proof_type='NIC'`

## 🔧 Migration Process

### Step 1: Data Migration
```javascript
// Migrated existing NIC values
UPDATE guest 
SET id_proof_type = 'NIC', 
    id_proof_number = nic
WHERE nic IS NOT NULL 
  AND (id_proof_type IS NULL OR id_proof_type = '')
```

### Step 2: Schema Change
```sql
ALTER TABLE guest DROP COLUMN IF EXISTS nic
```

**Result:** ✅ No data loss, clean schema

## 🎨 Frontend UI

### Guest Table Columns (7 columns)
| Guest ID | Name | Email | Phone | ID Type | ID Number | Nationality | Total Bookings |
|----------|------|-------|-------|---------|-----------|-------------|----------------|

### Create Guest Form Fields
1. **Full Name** * (required)
2. **Email**
3. **Phone**
4. **Address** (textarea)
5. **ID Proof Type** (dropdown)
   - NIC (National Identity Card)
   - Passport
   - Driving License
6. **ID Proof Number** (text input)
7. **Nationality** (e.g., Sri Lankan, American)
8. **Gender** (Male/Female/Other)
9. **Date of Birth** (date picker)

## 💻 Backend API

### GET /api/guests
**Returns:**
```json
{
  "guest_id": 1,
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+94771234567",
  "address": "123 Main St",
  "nationality": "Sri Lankan",
  "gender": "Male",
  "date_of_birth": "1990-01-01",
  "id_proof_type": "NIC",
  "id_proof_number": "199012345678",
  "total_bookings": 3
}
```

### POST /api/guests
**Accepts:**
```json
{
  "full_name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1-555-1234",
  "address": "456 Oak Ave",
  "nationality": "American",
  "gender": "Female",
  "date_of_birth": "1985-05-15",
  "id_proof_type": "Passport",
  "id_proof_number": "P12345678"
}
```

## 📝 Use Cases

### Example 1: Local Guest (Sri Lankan)
```
Full Name: Kamal Perera
ID Type: NIC
ID Number: 199512345678
Nationality: Sri Lankan
```

### Example 2: Foreign Guest (Tourist)
```
Full Name: Michael Johnson
ID Type: Passport
ID Number: US123456789
Nationality: American
```

### Example 3: Business Traveler
```
Full Name: Sarah Williams
ID Type: Driving License
ID Number: DL987654321
Nationality: British
```

## ✅ Benefits of This Approach

1. **Cleaner Schema** - Single ID type field instead of multiple columns
2. **Flexibility** - Supports any ID type (NIC, Passport, Driving License)
3. **Simplicity** - Users just select type and enter number
4. **International Ready** - No bias toward local/foreign guests
5. **No Data Loss** - Existing NIC data successfully migrated

## 🚀 Testing

**Database Migration:** ✅ Complete  
**Backend API:** ✅ Updated  
**Frontend Form:** ✅ Redesigned  
**Data Migration:** ✅ Verified  

## 📂 Files Modified

1. `backend/database/schema.sql` - Removed NIC column
2. `backend/database/migrations/remove-nic-column.js` - Migration script
3. `backend/src/routes/api.routes.js` - Updated GET/POST routes
4. `frontend/src/components/guests/GuestsPage.jsx` - Updated table & form

## 🎉 Ready to Use!

The system now has a clean, unified ID management system. Users can create guests with any ID type (NIC, Passport, or Driving License) and all data is stored in a consistent format.

**Servers Running:**
- Backend: http://localhost:4000 ✅
- Frontend: http://localhost:5174 ✅
