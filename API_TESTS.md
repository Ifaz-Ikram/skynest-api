# SkyNest Hotel API Test Examples

A comprehensive collection of API test examples using curl and JavaScript fetch.

## Setup

Make sure the server is running:
```bash
npm start
```

Default URL: `http://localhost:3000`

## Authentication

### 1. Login
```bash
# Admin login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Response includes token and user info
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": {
#     "user_id": 1,
#     "username": "admin",
#     "role": "Admin"
#   }
# }
```

### 2. Get Current User
```bash
TOKEN="your_jwt_token_here"

curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Logout
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

## Bookings

### 4. List All Bookings (Staff)
```bash
# As receptionist/manager/accountant
curl http://localhost:3000/bookings \
  -H "Authorization: Bearer $TOKEN"

# With filters
curl "http://localhost:3000/bookings?status=Booked&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 5. List Customer Bookings (Auto-filtered)
```bash
# As customer - only sees own bookings
curl http://localhost:3000/bookings \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

### 6. Get Booking Details
```bash
curl http://localhost:3000/bookings/1 \
  -H "Authorization: Bearer $TOKEN"
```

### 7. Get Full Booking (with services/payments)
```bash
curl http://localhost:3000/bookings/1/full \
  -H "Authorization: Bearer $TOKEN"
```

### 8. Create Booking (Receptionist/Manager)
```bash
curl -X POST http://localhost:3000/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "guest_id": 1,
    "room_id": 1,
    "check_in_date": "2025-10-20",
    "check_out_date": "2025-10-23",
    "booked_rate": 8000.00,
    "tax_rate_percent": 10.00,
    "advance_payment": 5000.00
  }'
```

### 9. Update Booking Status (Receptionist/Manager)
```bash
# Check-in
curl -X PATCH http://localhost:3000/bookings/1/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"Checked-In"}'

# Check-out
curl -X PATCH http://localhost:3000/bookings/2/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"Checked-Out"}'

# Cancel
curl -X PATCH http://localhost:3000/bookings/3/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"Cancelled"}'
```

### 10. Check Room Availability
```bash
curl "http://localhost:3000/bookings/rooms/1/availability?check_in=2025-10-20&check_out=2025-10-23" \
  -H "Authorization: Bearer $TOKEN"
```

### 11. List Free Rooms
```bash
curl "http://localhost:3000/bookings/rooms/free?check_in=2025-10-20&check_out=2025-10-23" \
  -H "Authorization: Bearer $TOKEN"
```

## Services

### 12. List Service Catalog
```bash
curl http://localhost:3000/service-catalog \
  -H "Authorization: Bearer $TOKEN"

# Active only
curl "http://localhost:3000/service-catalog?active=true" \
  -H "Authorization: Bearer $TOKEN"
```

### 13. Get Booking Services
```bash
curl http://localhost:3000/bookings/1/services \
  -H "Authorization: Bearer $TOKEN"
```

### 14. Add Service to Booking (Receptionist/Manager)
```bash
curl -X POST http://localhost:3000/service-usage \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": 1,
    "service_id": 2,
    "quantity": 1,
    "used_on": "2025-10-20"
  }'
```

## Payments & Adjustments

### 15. Get Booking Payments
```bash
curl http://localhost:3000/bookings/1/payments \
  -H "Authorization: Bearer $TOKEN"
```

### 16. Create Payment (Receptionist/Accountant/Manager)
```bash
curl -X POST http://localhost:3000/payments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": 1,
    "amount": 10000.00,
    "method": "Card",
    "payment_reference": "TXN123456"
  }'
```

### 17. Get Booking Adjustments
```bash
curl http://localhost:3000/bookings/1/adjustments \
  -H "Authorization: Bearer $TOKEN"
```

### 18. Create Adjustment (Manager/Accountant)
```bash
# Refund
curl -X POST http://localhost:3000/payment-adjustments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": 1,
    "amount": -500.00,
    "type": "Refund",
    "reason": "Service quality issue"
  }'

# Late fee
curl -X POST http://localhost:3000/payment-adjustments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": 1,
    "amount": 200.00,
    "type": "Late Fee",
    "reason": "Late checkout beyond grace period"
  }'
```

## Reports (Staff Only)

### 19. Occupancy by Day
```bash
curl http://localhost:3000/reports/occupancy-by-day \
  -H "Authorization: Bearer $TOKEN"
```

### 20. Billing Summary
```bash
curl http://localhost:3000/reports/billing-summary \
  -H "Authorization: Bearer $TOKEN"
```

### 21. Service Usage Detail
```bash
curl http://localhost:3000/reports/service-usage-detail \
  -H "Authorization: Bearer $TOKEN"

# With date filters
curl "http://localhost:3000/reports/service-usage-detail?from=2025-10-01&to=2025-10-31" \
  -H "Authorization: Bearer $TOKEN"
```

### 22. Payments Ledger
```bash
curl "http://localhost:3000/reports/payments-ledger?days=30" \
  -H "Authorization: Bearer $TOKEN"
```

### 23. Adjustments Log
```bash
curl "http://localhost:3000/reports/adjustments?days=30" \
  -H "Authorization: Bearer $TOKEN"
```

## Admin (Admin Only)

### 24. List All Users
```bash
curl http://localhost:3000/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 25. Create User
```bash
curl -X POST http://localhost:3000/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "password123",
    "role": "Receptionist"
  }'
```

### 26. Update User Role
```bash
curl -X PATCH http://localhost:3000/admin/users/5/role \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"Manager"}'
```

### 27. Delete User
```bash
curl -X DELETE http://localhost:3000/admin/users/5 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 28. Create Service in Catalog
```bash
curl -X POST http://localhost:3000/admin/service-catalog \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "POOL",
    "name": "Pool Access",
    "category": "Recreation",
    "unit_price": 500.00,
    "tax_rate_percent": 10.00,
    "active": true
  }'
```

### 29. Update Service
```bash
curl -X PUT http://localhost:3000/admin/service-catalog/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "LAUNDRY",
    "name": "Express Laundry Service",
    "category": "Housekeeping",
    "unit_price": 600.00,
    "tax_rate_percent": 10.00,
    "active": true
  }'
```

### 30. Delete Service
```bash
curl -X DELETE http://localhost:3000/admin/service-catalog/5 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Pre-Bookings

### 31. List Pre-Bookings (Staff)
```bash
curl http://localhost:3000/pre-bookings \
  -H "Authorization: Bearer $TOKEN"

# With filters
curl "http://localhost:3000/pre-bookings?from=2025-10-20&to=2025-10-30" \
  -H "Authorization: Bearer $TOKEN"
```

### 32. Get Pre-Booking Details
```bash
curl http://localhost:3000/pre-bookings/1 \
  -H "Authorization: Bearer $TOKEN"
```

### 33. Create Pre-Booking (Receptionist/Manager)
```bash
curl -X POST http://localhost:3000/pre-bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "guest_id": 1,
    "capacity": 2,
    "prebooking_method": "Phone",
    "expected_check_in": "2025-11-01",
    "expected_check_out": "2025-11-05"
  }'
```

## JavaScript/Fetch Examples

### Example 1: Login Flow
```javascript
async function loginAndFetchBookings() {
  // Login
  const loginRes = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'receptionist',
      password: 'receptionist123'
    })
  })
  
  const { token } = await loginRes.json()
  
  // Fetch bookings
  const bookingsRes = await fetch('http://localhost:3000/bookings?status=Booked', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  
  const { bookings } = await bookingsRes.json()
  console.log('Bookings:', bookings)
}
```

### Example 2: Create Booking with Payment
```javascript
async function createBookingWithPayment(token) {
  const response = await fetch('http://localhost:3000/bookings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      guest_id: 1,
      room_id: 2,
      check_in_date: '2025-10-25',
      check_out_date: '2025-10-28',
      booked_rate: 8000.00,
      tax_rate_percent: 10.00,
      advance_payment: 5000.00
    })
  })
  
  const result = await response.json()
  
  if (!response.ok) {
    // Handle room overlap error
    if (result.error?.includes('overlap') || result.error?.includes('23P01')) {
      console.error('Room is already booked for these dates!')
    } else {
      console.error('Booking failed:', result.error)
    }
  } else {
    console.log('Booking created:', result.booking)
  }
}
```

### Example 3: Calculate Booking Balance
```javascript
async function getBookingBalance(token, bookingId) {
  const [booking, services, payments] = await Promise.all([
    fetch(`http://localhost:3000/bookings/${bookingId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()),
    
    fetch(`http://localhost:3000/bookings/${bookingId}/services`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()),
    
    fetch(`http://localhost:3000/bookings/${bookingId}/payments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json())
  ])
  
  const b = booking.booking
  const nights = Math.round((new Date(b.check_out_date) - new Date(b.check_in_date)) / 86400000)
  
  const roomTotal = nights * Number(b.booked_rate)
  const servicesTotal = Number(services.services_total || 0)
  const preTax = roomTotal + servicesTotal - Number(b.discount_amount || 0) + Number(b.late_fee_amount || 0)
  const tax = preTax * (Number(b.tax_rate_percent || 0) / 100)
  const grossTotal = preTax + tax
  
  const totalPaid = Number(payments.totals?.total_paid || 0)
  const totalAdjust = Number(payments.totals?.total_adjust || 0)
  const advance = Number(b.advance_payment || 0)
  
  const balance = grossTotal - (totalPaid + advance) + totalAdjust
  
  console.log({
    nights,
    roomTotal: roomTotal.toFixed(2),
    servicesTotal: servicesTotal.toFixed(2),
    tax: tax.toFixed(2),
    grossTotal: grossTotal.toFixed(2),
    totalPaid: totalPaid.toFixed(2),
    balance: balance.toFixed(2)
  })
}
```

## Testing RBAC (Role-Based Access Control)

### Test 1: Customer Cannot Access Admin Routes
```bash
# This should return 403 Forbidden
curl http://localhost:3000/admin/users \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

### Test 2: Customer Only Sees Own Bookings
```bash
# Customer with guest_id=1 only sees bookings for guest_id=1
curl http://localhost:3000/bookings \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

### Test 3: Receptionist Cannot Create Adjustments
```bash
# This should return 403 Forbidden
curl -X POST http://localhost:3000/payment-adjustments \
  -H "Authorization: Bearer $RECEPTIONIST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": 1,
    "amount": -100.00,
    "type": "Refund",
    "reason": "Test"
  }'
```

### Test 4: Manager Can Create Adjustments
```bash
# This should succeed
curl -X POST http://localhost:3000/payment-adjustments \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": 1,
    "amount": -100.00,
    "type": "Refund",
    "reason": "Service compensation"
  }'
```

## Error Handling Examples

### Room Overlap Error (23P01)
```bash
# Try to book the same room for overlapping dates
curl -X POST http://localhost:3000/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "guest_id": 1,
    "room_id": 1,
    "check_in_date": "2025-10-20",
    "check_out_date": "2025-10-23",
    "booked_rate": 5000.00
  }'

# Expected: 409 Conflict with user-friendly message
```

### Invalid Status Transition
```bash
# Try to check-out a booking that's not checked-in
curl -X PATCH http://localhost:3000/bookings/1/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"Checked-Out"}'

# Expected: 400 Bad Request with validation error
```

## Tips

1. **Save tokens**: Store tokens in environment variables for easier testing
   ```bash
   export ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   export CUSTOMER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ```

2. **Use jq for pretty JSON**: 
   ```bash
   curl http://localhost:3000/bookings -H "Authorization: Bearer $TOKEN" | jq
   ```

3. **Check response status**:
   ```bash
   curl -w "\nHTTP Status: %{http_code}\n" http://localhost:3000/bookings \
     -H "Authorization: Bearer $TOKEN"
   ```

4. **Test with Postman/Thunder Client**: Import these examples into your favorite API client for easier testing

---

**Happy Testing! 🚀**
