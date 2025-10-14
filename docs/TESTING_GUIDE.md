# 🧪 SkyNest Frontend - Testing Guide

## 🚀 Quick Start

### 1. Start Backend
```bash
npm start
```
Backend runs on: http://localhost:4000

### 2. Start Frontend
```bash
cd frontend
npm run dev
```
Frontend runs on: http://localhost:5174 (or 5173)

## 🔐 Test Accounts

### Demo Login Credentials
| Username | Password | Role | Access Level |
|----------|----------|------|--------------|
| admin | admin123 | Admin | Full access (all features) |
| manager | manager123 | Manager | Create bookings, reports, payments |
| receptionist | receptionist123 | Receptionist | Bookings, check-in/out |
| accountant | accountant123 | Accountant | Payments, reports |
| customer | customer123 | Customer | View bookings, rooms, services |

## ✅ Features to Test

### 1. Authentication
- [ ] Login with admin credentials
- [ ] Login with different role (manager, receptionist, etc.)
- [ ] Check that "Users" menu only shows for Admin
- [ ] Logout and verify redirect to login
- [ ] Refresh page and verify session persists
- [ ] Try invalid credentials

### 2. Dashboard
- [ ] View total bookings count
- [ ] View active bookings count
- [ ] View total revenue
- [ ] View occupancy rate
- [ ] Check recent bookings table
- [ ] Verify all data loads correctly

### 3. Bookings Page
**List & Filter:**
- [ ] View all bookings
- [ ] Filter by "All"
- [ ] Filter by "Booked"
- [ ] Filter by "Checked-In"
- [ ] Filter by "Checked-Out"
- [ ] Filter by "Cancelled"

**Create Booking:**
- [ ] Click "New Booking" button
- [ ] Fill in all fields:
  - Customer ID: 1
  - Room ID: 1
  - Check In Date: Tomorrow's date
  - Check Out Date: Date after tomorrow
  - Number of Guests: 2
- [ ] Submit and verify booking appears in list

**Booking Actions:**
- [ ] Find a booking with status "Booked"
- [ ] Click "Check In" button
- [ ] Verify status changes to "Checked-In"
- [ ] Click "Check Out" button
- [ ] Verify status changes to "Checked-Out"

**View Details:**
- [ ] Click "View Details" on any booking
- [ ] Verify all information displays correctly
- [ ] Close modal

### 4. Rooms Page
**View All Rooms:**
- [ ] Click "All Rooms" button
- [ ] Verify room cards display
- [ ] Check room number, type, floor
- [ ] Check price per night
- [ ] Check max occupancy
- [ ] Check status badge colors

**View Available Rooms:**
- [ ] Click "Available" button
- [ ] Verify only available rooms show
- [ ] Compare count with "All Rooms"

### 5. Services Page
- [ ] View all hotel services
- [ ] Check service names display
- [ ] Check descriptions display
- [ ] Check prices display
- [ ] Verify grid layout

### 6. Payments Page
**View Payments:**
- [ ] View payments table
- [ ] Check payment ID, booking ID
- [ ] Check amounts
- [ ] Check payment methods
- [ ] Check dates
- [ ] Check status badges

**Create Payment:**
- [ ] Click "Record Payment" button
- [ ] Fill in form:
  - Booking ID: 1
  - Amount: 100.00
  - Payment Method: Cash (or Credit Card)
- [ ] Submit and verify payment appears
- [ ] Check status is "Completed"

### 7. Reports Page
**Generate Reports:**
- [ ] Set start date (e.g., 2025-01-01)
- [ ] Set end date (e.g., 2025-12-31)

**Test Each Report:**
- [ ] Click "Occupancy Report" - verify data loads
- [ ] Click "Revenue Report" - verify data loads
- [ ] Click "Bookings Summary" - verify data loads
- [ ] Click "Payments Report" - verify data loads
- [ ] Click "Customer Report" - verify data loads
- [ ] Click "Services Usage" - verify data loads

**Check Report Display:**
- [ ] Verify report title shows
- [ ] Verify JSON data displays
- [ ] Verify data is readable

### 8. Users Page (Admin Only)
**Access Control:**
- [ ] Login as "customer" - Users menu should NOT appear
- [ ] Login as "admin" - Users menu should appear

**View Users:**
- [ ] Click "Users" in sidebar
- [ ] View all users
- [ ] Check usernames, emails, roles

**Create User:**
- [ ] Click "Add User" button
- [ ] Fill in form:
  - Username: testuser
  - Email: test@example.com
  - Password: test123
  - Role: Customer
- [ ] Submit and verify user appears
- [ ] Check role badge color

## 🎨 UI/UX Testing

### Responsive Design
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768px width)
- [ ] Test on mobile (375px width)
- [ ] Verify sidebar collapses properly
- [ ] Verify tables scroll horizontally on small screens
- [ ] Verify modals are centered and scrollable

### Navigation
- [ ] Click each menu item
- [ ] Verify active state highlights
- [ ] Verify page content changes
- [ ] Test sidebar toggle button
- [ ] Test logout button

### Loading States
- [ ] Refresh any page and watch for loading spinners
- [ ] Verify skeleton screens on dashboard
- [ ] Verify "Loading..." messages appear

### Empty States
- [ ] If any page has no data, verify empty state icon and message
- [ ] Check "No bookings found", "No payments found", etc.

### Error Handling
- [ ] Try creating booking with invalid data
- [ ] Try creating payment with invalid data
- [ ] Check error messages display
- [ ] Verify form doesn't submit

### Modals
- [ ] Open each modal type
- [ ] Verify close button (X) works
- [ ] Verify cancel button works
- [ ] Verify clicking outside modal doesn't close it
- [ ] Verify scrolling works in tall modals

### Status Badges
- [ ] Check booking status colors:
  - Booked = Blue
  - Checked-In = Green
  - Checked-Out = Gray
  - Cancelled = Red
- [ ] Check payment status colors:
  - Completed = Green
  - Pending = Yellow
  - Failed = Red
- [ ] Check room status colors:
  - Available = Green
  - Occupied = Red
  - Maintenance = Yellow

## 🐛 Known Issues to Check

### Backend Connection
- [ ] Verify backend is running on port 4000
- [ ] Verify CORS is enabled
- [ ] Check browser console for errors
- [ ] Check network tab for API calls

### Data Consistency
- [ ] Create booking and check if it appears in dashboard
- [ ] Create payment and verify total revenue updates
- [ ] Check-in booking and verify active bookings count

### Browser Compatibility
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Edge
- [ ] Test in Safari (if available)

## 📊 Expected Results

### Initial Data (from demo-data.js)
- **Customers**: 10+
- **Employees**: 5
- **Rooms**: 20
- **Services**: 10+
- **Bookings**: Multiple (past and future)
- **Payments**: Multiple

### Dashboard Stats
- Total Bookings: 10+
- Active Bookings: 2-5
- Total Revenue: $5,000+
- Occupancy Rate: 60-80%

## 🎯 Success Criteria

All features should:
- ✅ Load data from backend successfully
- ✅ Display data in beautiful UI
- ✅ Allow user interactions (create, view, update)
- ✅ Show appropriate loading states
- ✅ Handle errors gracefully
- ✅ Work on all screen sizes
- ✅ Use consistent design system
- ✅ Have smooth animations

## 🚨 Troubleshooting

### Frontend not loading
```bash
cd frontend
npm install
npm run dev
```

### Backend not responding
```bash
npm install
npm start
```

### Database connection errors
```bash
# Check MySQL is running
# Check credentials in server.js or .env
```

### Port already in use
```bash
# Kill process on port 4000 (backend)
# Kill process on port 5173 (frontend)
# Or let Vite auto-select next port (5174, 5175, etc.)
```

### CORS errors
- Verify backend has CORS enabled for http://localhost:5173
- Check server.js or middleware/cors.js

## 📝 Testing Checklist Summary

### Core Features (Must Test)
- [ ] Login/Logout
- [ ] Dashboard loads
- [ ] View bookings list
- [ ] Create new booking
- [ ] Check-in/Check-out
- [ ] View rooms (All + Available)
- [ ] View services
- [ ] View payments
- [ ] Create payment
- [ ] Generate at least 1 report
- [ ] View users (as Admin)
- [ ] Create user (as Admin)

### UI/UX (Should Test)
- [ ] Responsive on mobile
- [ ] Sidebar toggle works
- [ ] All modals open/close
- [ ] Loading states show
- [ ] Empty states show
- [ ] Status badges colored correctly

### Edge Cases (Nice to Test)
- [ ] Invalid login
- [ ] Expired token
- [ ] Network error
- [ ] Invalid form data
- [ ] Very long content
- [ ] Special characters in input

## 🎉 When Testing is Complete

If all tests pass, you have:
- ✅ Fully functional hotel management system
- ✅ Production-ready frontend
- ✅ Complete backend integration
- ✅ Beautiful UI/UX
- ✅ Role-based access control
- ✅ Comprehensive feature set

**Ready for deployment!** 🚀
