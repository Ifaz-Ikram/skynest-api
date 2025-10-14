# Testing Role-Based User Creation

## Quick Test Guide

### 1. Test Customer Registration (Public - No Auth Required)

```bash
# Create a customer account
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"customer1\",
    \"password\": \"password123\",
    \"confirmPassword\": \"password123\",
    \"full_name\": \"Customer One\",
    \"email\": \"customer1@example.com\",
    \"phone\": \"+1111111111\",
    \"address\": \"123 Customer St\"
  }"
```

**Expected Result**: ✅ Success - Customer account created

---

### 2. Test Admin Creating Employees

#### First, login as Admin to get token:
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"admin\", \"password\": \"admin123\"}"
```

#### Test 1: Admin creates Manager (Should succeed ✅)
```bash
curl -X POST http://localhost:4000/api/admin/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d "{
    \"username\": \"manager1\",
    \"password\": \"password123\",
    \"role\": \"Manager\",
    \"full_name\": \"Manager One\",
    \"email\": \"manager1@skynest.com\",
    \"phone\": \"+2222222222\"
  }"
```

**Expected Result**: ✅ Success - Manager account created

#### Test 2: Admin creates Receptionist (Should succeed ✅)
```bash
curl -X POST http://localhost:4000/api/admin/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d "{
    \"username\": \"receptionist1\",
    \"password\": \"password123\",
    \"role\": \"Receptionist\",
    \"full_name\": \"Receptionist One\",
    \"email\": \"receptionist1@skynest.com\"
  }"
```

**Expected Result**: ✅ Success - Receptionist account created

#### Test 3: Admin creates Accountant (Should succeed ✅)
```bash
curl -X POST http://localhost:4000/api/admin/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d "{
    \"username\": \"accountant1\",
    \"password\": \"password123\",
    \"role\": \"Accountant\",
    \"full_name\": \"Accountant One\",
    \"email\": \"accountant1@skynest.com\"
  }"
```

**Expected Result**: ✅ Success - Accountant account created

#### Test 4: Admin creates another Admin (Should succeed ✅)
```bash
curl -X POST http://localhost:4000/api/admin/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d "{
    \"username\": \"admin2\",
    \"password\": \"password123\",
    \"role\": \"Admin\",
    \"full_name\": \"Admin Two\",
    \"email\": \"admin2@skynest.com\"
  }"
```

**Expected Result**: ✅ Success - Admin account created

---

### 3. Test Manager Creating Employees

#### First, login as Manager:
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"manager1\", \"password\": \"password123\"}"
```

#### Test 5: Manager creates Receptionist (Should succeed ✅)
```bash
curl -X POST http://localhost:4000/api/admin/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <MANAGER_TOKEN>" \
  -d "{
    \"username\": \"receptionist2\",
    \"password\": \"password123\",
    \"role\": \"Receptionist\",
    \"full_name\": \"Receptionist Two\",
    \"email\": \"receptionist2@skynest.com\"
  }"
```

**Expected Result**: ✅ Success - Receptionist account created

#### Test 6: Manager creates Accountant (Should succeed ✅)
```bash
curl -X POST http://localhost:4000/api/admin/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <MANAGER_TOKEN>" \
  -d "{
    \"username\": \"accountant2\",
    \"password\": \"password123\",
    \"role\": \"Accountant\",
    \"full_name\": \"Accountant Two\",
    \"email\": \"accountant2@skynest.com\"
  }"
```

**Expected Result**: ✅ Success - Accountant account created

#### Test 7: Manager tries to create Admin (Should FAIL ❌)
```bash
curl -X POST http://localhost:4000/api/admin/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <MANAGER_TOKEN>" \
  -d "{
    \"username\": \"admin3\",
    \"password\": \"password123\",
    \"role\": \"Admin\",
    \"full_name\": \"Admin Three\",
    \"email\": \"admin3@skynest.com\"
  }"
```

**Expected Result**: ❌ Forbidden - "You don't have permission to create Admin accounts"

---

### 4. Test Receptionist Permissions

#### First, login as Receptionist:
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"receptionist1\", \"password\": \"password123\"}"
```

#### Test 8: Receptionist tries to create Manager (Should FAIL ❌)
```bash
curl -X POST http://localhost:4000/api/admin/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <RECEPTIONIST_TOKEN>" \
  -d "{
    \"username\": \"manager2\",
    \"password\": \"password123\",
    \"role\": \"Manager\",
    \"full_name\": \"Manager Two\",
    \"email\": \"manager2@skynest.com\"
  }"
```

**Expected Result**: ❌ Forbidden - Route blocked by requireRole('Admin', 'Manager')

#### Test 9: Receptionist tries to create Customer via employee endpoint (Should FAIL ❌)
```bash
curl -X POST http://localhost:4000/api/admin/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <RECEPTIONIST_TOKEN>" \
  -d "{
    \"username\": \"customer2\",
    \"password\": \"password123\",
    \"role\": \"Customer\",
    \"full_name\": \"Customer Two\",
    \"email\": \"customer2@skynest.com\"
  }"
```

**Expected Result**: ❌ Forbidden - Route blocked by requireRole('Admin', 'Manager')

---

### 5. Test Get Allowed Roles

#### As Admin:
```bash
curl -X GET http://localhost:4000/api/admin/allowed-roles \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected Response**:
```json
{
  "currentRole": "Admin",
  "allowedRoles": ["Admin", "Manager", "Receptionist", "Accountant"]
}
```

#### As Manager:
```bash
curl -X GET http://localhost:4000/api/admin/allowed-roles \
  -H "Authorization: Bearer <MANAGER_TOKEN>"
```

**Expected Response**:
```json
{
  "currentRole": "Manager",
  "allowedRoles": ["Manager", "Receptionist", "Accountant"]
}
```

#### As Receptionist:
```bash
curl -X GET http://localhost:4000/api/admin/allowed-roles \
  -H "Authorization: Bearer <RECEPTIONIST_TOKEN>"
```

**Expected Response**:
```json
{
  "currentRole": "Receptionist",
  "allowedRoles": []
}
```

---

## Test Summary

| Test | User Role | Target Role | Expected | Reason |
|------|-----------|-------------|----------|---------|
| 1 | Public | Customer | ✅ Pass | Public registration allowed |
| 2 | Admin | Manager | ✅ Pass | Admin can create all |
| 3 | Admin | Receptionist | ✅ Pass | Admin can create all |
| 4 | Admin | Accountant | ✅ Pass | Admin can create all |
| 5 | Admin | Admin | ✅ Pass | Admin can create all |
| 6 | Manager | Receptionist | ✅ Pass | Manager can create Receptionist |
| 7 | Manager | Accountant | ✅ Pass | Manager can create Accountant |
| 8 | Manager | Manager | ❌ Fail | Manager cannot create Manager |
| 9 | Manager | Admin | ❌ Fail | Manager cannot create Admin |
| 10 | Receptionist | Manager | ❌ Fail | Receptionist cannot create employees |
| 11 | Receptionist | Customer | ❌ Fail | Must use public registration |

---

## PowerShell Version (Windows)

### Customer Registration
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/auth/register" `
  -ContentType "application/json" `
  -Body (@{
    username = "customer1"
    password = "password123"
    confirmPassword = "password123"
    full_name = "Customer One"
    email = "customer1@example.com"
    phone = "+1111111111"
    address = "123 Customer St"
  } | ConvertTo-Json)
```

### Admin Login
```powershell
$adminResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/auth/login" `
  -ContentType "application/json" `
  -Body (@{username = "admin"; password = "admin123"} | ConvertTo-Json)

$adminToken = $adminResponse.token
```

### Create Manager (as Admin)
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/admin/employees" `
  -ContentType "application/json" `
  -Headers @{Authorization = "Bearer $adminToken"} `
  -Body (@{
    username = "manager1"
    password = "password123"
    role = "Manager"
    full_name = "Manager One"
    email = "manager1@skynest.com"
    phone = "+2222222222"
  } | ConvertTo-Json)
```

### Get Allowed Roles
```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:4000/api/admin/allowed-roles" `
  -Headers @{Authorization = "Bearer $adminToken"}
```
