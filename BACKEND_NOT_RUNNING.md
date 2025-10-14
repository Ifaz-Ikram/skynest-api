# Backend Server Not Running - FIX REQUIRED

**Date:** October 14, 2025  
**Issue:** Backend server crashes immediately after starting  
**Status:** ⚠️ NEEDS FIX  

## 🐛 Problem

All pages in the frontend show "Failed to fetch" errors because the backend API is not running.

### Symptoms:
- ✅ Server says "✅ API listening on http://localhost:4000"
- ❌ Server immediately exits after startup message
- ❌ Port 4000 is NOT listening
- ❌ `curl http://localhost:4000/health` fails with "Unable to connect"
- ❌ All frontend pages show "Error loading..." / "Failed to fetch"

### Root Cause:
The backend server (`backend/server.js`) is **crashing silently** right after calling `app.listen()`. This indicates an **uncaught exception** is occurring during initialization.

## 🔍 Investigation Steps Taken

1. ✅ Checked if backend folder exists - YES
2. ✅ Checked if `backend/server.js` exists - YES  
3. ✅ Checked if database connection works - YES ("✅ Sequelize connected")
4. ✅ Checked if port 4000 is blocked - NO
5. ❌ Server crashes immediately after `app.listen()`

## 🔧 Likely Causes

Based on the symptoms, the server is crashing due to one of these issues:

1. **Missing Controller File** - One of the require() statements in routes is failing
2. **Database Model Error** - A model or association is incorrectly defined
3. **Uncaught Promise Rejection** - An async operation is failing silently
4. **Missing Dependency** - A required npm package is not installed

## ✅ How to Debug

### Step 1: Check if all controllers exist

Run this command from the backend folder:

```powershell
cd backend
ls src/controllers/*.js
```

**Expected files:**
- `admin.controller.js`
- `auth.controller.js`
- `booking.controller.js`
- `invoice.controller.js`
- `prebooking.controller.js`
- `report.controller.js`
- `service-payment.controller.js`

### Step 2: Check if prebooking controller exists

```powershell
cat src/controllers/prebooking.controller.js
```

If this file is missing or has errors, that's the problem!

### Step 3: Add error handling to server.js

Edit `backend/server.js` and wrap everything in try-catch:

```javascript
require("dotenv").config();
const { app } = require("./src/app");
const { sequelize } = require("./src/models");

const port = Number(process.env.PORT || 4000);

async function start() {
  try {
    await sequelize.authenticate();
    console.log("✅ DB ok");
    
    const server = app.listen(port, () => {
      console.log(`✅ API listening on http://localhost:4000`);
    });
    
    // Add error handler for uncaught exceptions
    server.on('error', (error) => {
      console.error("❌ Server error:", error);
      process.exit(1);
    });
    
  } catch (err) {
    console.error("❌ Failed to start", err);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

start();

module.exports = { app };
```

### Step 4: Run server with detailed output

```powershell
cd backend
$env:NODE_ENV="development"
node server.js
```

Watch for any error messages that appear AFTER "✅ API listening on http://localhost:4000"

## 🚀 Quick Fix to Test

If you want to test if the issue is in the routes, temporarily comment out the problematic routes in `backend/src/routes/api.routes.js`:

```javascript
// Temporarily comment this line if causing issues:
// const preBookingController = require('../controllers/prebooking.controller');

// And comment out these routes:
// router.get('/pre-bookings', requireAuth, requireStaff, preBookingController.listPreBookings);
// router.get('/prebookings', requireAuth, requireStaff, preBookingController.listPreBookings);
```

Then restart the server and see if it stays running.

## 📝 Expected Behavior

When the backend is working correctly:

1. Run: `cd backend; npm run dev`
2. See: "✅ API listening on http://localhost:4000"
3. Server **stays running** (doesn't return to prompt)
4. Test: `curl http://localhost:4000/health` returns `{"ok":true}`
5. Frontend pages load data successfully

## 🎯 Next Steps

1. Add error handlers to `backend/server.js` (see Step 3 above)
2. Run server again and capture the error message
3. Check if all required controller files exist
4. Verify all npm dependencies are installed: `cd backend; npm install`
5. Check database is accessible: `psql -U postgres -d skynest`

## 💡 Temporary Workaround

Until the backend is fixed, the frontend will show "Failed to fetch" on all pages. You can:

1. Fix the backend server crash issue
2. OR run the old monolithic version if you have it backed up
3. OR start with a minimal backend (health endpoint only) and add routes gradually

## 📊 Server Status

| Component | Status |
|-----------|--------|
| Backend Code | ✅ Exists |
| Database | ✅ Connected |
| Server Listen | ✅ Starts |
| Server Running | ❌ **CRASHES** |
| API Responding | ❌ **NOT WORKING** |
| Frontend | ⚠️ Shows errors |

**CRITICAL:** Backend must be fixed before frontend pages will work!
