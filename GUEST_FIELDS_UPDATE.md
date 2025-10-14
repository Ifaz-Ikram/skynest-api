# Guest Fields Update - Support for Both Local & Foreign Guests

**Date:** October 14, 2025  
**Purpose:** Added `id_proof_type` and `id_proof_number` fields to support both local guests (NIC) and foreign guests (Passport, Visa, etc.)

## Changes Made

### 1. Database Schema ✅

**Added Columns:**
- `id_proof_type` VARCHAR(50) - Type of identification (Passport, Driver License, National ID, Visa, Other)
- `id_proof_number` VARCHAR(50) - The actual ID number

**Migration Script:** `backend/database/migrations/add-id-proof-fields.js`
```sql
ALTER TABLE guest 
ADD COLUMN IF NOT EXISTS id_proof_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS id_proof_number VARCHAR(50)
```

**Updated Schema File:** `backend/database/schema.sql`
```sql
CREATE TABLE public.guest (
    guest_id bigint NOT NULL,
    nic character varying(30),
    full_name character varying(120) NOT NULL,
    email character varying(150),
    phone character varying(30),
    gender character varying(20),
    date_of_birth date,
    address text,
    nationality character varying(80),
    id_proof_type character varying(50),      -- NEW
    id_proof_number character varying(50)     -- NEW
);
```

### 2. Backend API ✅

**File:** `backend/src/routes/api.routes.js`

**GET /api/guests:**
- Added `id_proof_type` and `id_proof_number` to SELECT query
- Added both fields to GROUP BY clause

**POST /api/guests:**
- Added both fields to destructured request body
- Added both fields to INSERT statement (9 params → 10 params)
- Both fields are optional (null allowed)

### 3. Frontend UI ✅

**File:** `frontend/src/components/guests/GuestsPage.jsx`

**Table Updates:**
- Added "ID Type" column header
- Added "ID Number" column header  
- Now displays: Guest ID, Name, Email, Phone, NIC, ID Type, ID Number, Total Bookings
- Updated colspan from 7 to 8 for empty state

**Create Guest Modal:**
- Added `id_proof_type` field to form state
- Added `id_proof_number` field to form state
- Added dropdown select for ID Proof Type with options:
  - Passport
  - Driver License
  - National ID
  - Visa
  - Other
- Added text input for ID Proof Number

## Use Cases

### Local Guests (Sri Lankan)
- Fill in **NIC** field (National Identity Card)
- Optionally fill **Nationality** as "Sri Lankan"
- Leave **ID Proof Type** and **ID Proof Number** empty (or also fill if needed)

### Foreign Guests
- Fill in **ID Proof Type** (e.g., Passport, Visa)
- Fill in **ID Proof Number** (e.g., passport number)
- Fill in **Nationality** (e.g., "American", "British", "Indian")
- **NIC** can be left empty

### Flexible Approach
- All identification fields are **optional**
- System supports guests with:
  - Only NIC (locals)
  - Only Passport/ID (foreigners)
  - Both (for completeness)
  - Neither (minimal info entry)

## Testing

✅ Database migration successful  
✅ Backend API routes updated  
✅ Frontend form fields added  
✅ Table columns display correctly  

**Next Steps:**
1. Test creating a local guest with only NIC
2. Test creating a foreign guest with Passport
3. Test creating a guest with both NIC and Passport
4. Verify data displays correctly in the table

## Git Commit

```
feat: add id_proof_type and id_proof_number fields for foreign guests
- Added database columns via migration
- Updated GET and POST /api/guests routes
- Enhanced frontend form with ID proof fields
- Table now shows NIC, ID Type, and ID Number columns
```

**Commit Hash:** d114386

---

**Summary:** The guest management system now fully supports both local guests (using NIC) and foreign guests (using Passport, Visa, etc.), making it suitable for international hotel operations! 🌍✨
