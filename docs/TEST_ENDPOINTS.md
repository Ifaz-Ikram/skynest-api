# 🧪 API Endpoints Testing Guide

## Quick Test with Browser Console

Login to the app first with `admin/admin123`, then open browser console and run:

```javascript
// Test all endpoints
const testEndpoints = async () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  const tests = [
    { name: 'Bookings', url: '/api/bookings' },
    { name: 'Pre-bookings', url: '/api/prebookings' },
    { name: 'Rooms', url: '/api/rooms' },
    { name: 'Services', url: '/api/services' },
    { name: 'Service Usage', url: '/api/services/usage' },
    { name: 'Guests', url: '/api/guests' },
    { name: 'Branches', url: '/api/branches' },
    { name: 'Admin Branches', url: '/api/admin/branches' },
    { name: 'Users', url: '/api/admin/users' },
    { name: 'Catalog Rooms', url: '/api/catalog/rooms' },
    { name: 'Catalog Services', url: '/api/catalog/services' },
    { name: 'Free Rooms', url: '/api/catalog/free-rooms' },
    { name: 'Report: Occupancy', url: '/api/reports/occupancy' },
    { name: 'Report: Revenue', url: '/api/reports/revenue' },
  ];
  
  console.log('🧪 Testing all endpoints...\n');
  
  for (const test of tests) {
    try {
      const res = await fetch(`http://localhost:4000${test.url}`, { headers });
      const status = res.ok ? '✅' : '❌';
      console.log(`${status} ${test.name}: ${res.status} ${res.statusText}`);
    } catch (err) {
      console.log(`❌ ${test.name}: ERROR - ${err.message}`);
    }
  }
  
  console.log('\n✅ Testing complete!');
};

testEndpoints();
```

## Manual Testing Checklist

### 1. Dashboard Page ✓
- [ ] View occupancy stats
- [ ] View revenue charts
- [ ] View recent bookings

### 2. Bookings Page ✓
- [ ] List all bookings
- [ ] Create new booking
- [ ] Check-in booking
- [ ] Check-out booking
- [ ] View booking details

### 3. Pre-Bookings Page ✓
- [ ] List pre-bookings
- [ ] Create pre-booking
- [ ] View pre-booking details
- [ ] Convert to booking

### 4. Guests Page ✓
- [ ] List all guests
- [ ] Create new guest
- [ ] View guest details
- [ ] Edit guest info

### 5. Rooms Page ✓
- [ ] List all rooms
- [ ] Filter by branch
- [ ] Filter by availability
- [ ] View room details

### 6. Services Page ✓
- [ ] List all services
- [ ] Create service (Admin only)
- [ ] Edit service
- [ ] Delete service

### 7. Service Usage Page ✓
- [ ] List all service usage
- [ ] Add service to booking
- [ ] View usage history

### 8. Payments Page ✓
- [ ] List all payments
- [ ] Create payment
- [ ] Create adjustment
- [ ] View payment history

### 9. Invoices Page ✓
- [ ] Generate invoice
- [ ] View invoice HTML
- [ ] Download invoice
- [ ] Email invoice

### 10. Reports Page ✓
- [ ] Occupancy report
- [ ] Revenue report
- [ ] Service usage report
- [ ] Billing summary
- [ ] Outstanding balances

### 11. Branches Page ✓
- [ ] List all branches
- [ ] View branch details
- [ ] View branch rooms
- [ ] Branch statistics

### 12. Users Page (Admin) ✓
- [ ] List all users
- [ ] Create user
- [ ] Update user role
- [ ] View user details

### 13. Audit Log Page ✓
- [ ] View all activities
- [ ] Filter by user
- [ ] Filter by date
- [ ] Export logs

## Expected Results

All endpoints should return:
- ✅ Status 200 OK
- ✅ Valid JSON data
- ✅ No "Route not found" errors
- ✅ No CORS errors
- ✅ Proper authentication checks

## Common Issues & Solutions

### Issue: 401 Unauthorized
**Solution:** Login again with `admin/admin123`

### Issue: 403 Forbidden
**Solution:** Check user role permissions

### Issue: 404 Not Found
**Solution:** Verify backend is running on port 4000

### Issue: Network Error
**Solution:** 
1. Check backend: `npm run dev`
2. Check frontend: `cd frontend; npm run dev`
3. Verify ports: Backend (4000), Frontend (5174)

## Database Check

Verify database has data:
```sql
SELECT COUNT(*) FROM booking;
SELECT COUNT(*) FROM guest;
SELECT COUNT(*) FROM room;
SELECT COUNT(*) FROM service_catalog;
SELECT COUNT(*) FROM user_account;
```

If counts are 0, run seed data:
```bash
npm run seed
```
