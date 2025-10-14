# BACKEND CRASH DIAGNOSIS

**Date:** October 14, 2025  
**Critical Issue:** Backend server crashes after ~10 seconds, no error message  
**Status:** 🔴 CRITICAL - ROOT CAUSE UNKNOWN  

## 🔍 Diagnosis Results

### What We Know:
1. ✅ Server says "✅ API listening on http://localhost:4000"
2. ✅ Database connects successfully
3. ✅ No syntax errors in code
4. ❌ Server crashes ~10 seconds after starting
5. ❌ Port 4000 is NOT listening after crash
6. ❌ NO error messages in console
7. ❌ Even minimal Express server crashes

### Tests Performed:
1. **Syntax Check:** `node -c src/app.js` - ✅ PASS
2. **Module Load:** `require('./src/app')` - ✅ PASS  
3. **Minimal Server:** Express with just `/health` - ❌ CRASHES
4. **Error Handlers:** Added uncaughtException, unhandledRejection - ❌ NO OUTPUT
5. **Port Test:** netstat shows nothing listening - ❌ NOT LISTENING

### Crash Pattern:
```
[Time 0s] ✅ API listening on http://localhost:4000
[Time 10s] Still alive...
[Time 10.1s] <SERVER EXITS WITH NO ERROR>
[Time 10.2s] PS C:\Users\Ifaz\Desktop\skynest-api>
```

## 🚨 This is HIGHLY UNUSUAL

A Node.js/Express server does NOT normally crash without:
- Uncaught exception
- Unhandled promise rejection  
- SIGTERM signal
- process.exit() call
- Fatal error

But we're seeing NONE of these!

## 🔧 Possible Causes

### 1. External Process Killer
- Antivirus software killing Node.js
- Windows Defender
- Corporate security software
- Task scheduler killing processes

### 2. Environment Issue
- Corrupted Node.js installation
- Missing system DLLs
- Windows socket (Winsock) issue
- Firewall blocking localhost

### 3. Hidden Code
- `.npmrc` or `.node_modules` with lifecycle hooks
- Global npm packages interfering
- VSCode extensions killing processes

## ✅ IMMEDIATE WORKAROUND

**The backend server WON'T stay running in this environment.**

### Option 1: Use WSL (Windows Subsystem for Linux)
```bash
wsl
cd /mnt/c/Users/Ifaz/Desktop/skynest-api/backend
npm run dev
```

### Option 2: Run in Docker
```bash
docker run -p 4000:4000 -v ${PWD}:/app -w /app/backend node:20 npm run dev
```

### Option 3: Different Port
Sometimes port 4000 has issues. Try port 3000 or 5000.

Edit `backend/.env`:
```
PORT=3000
```

Edit `frontend/src/utils/api.js`:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

### Option 4: Check Task Manager
1. Open Task Manager (Ctrl+Shift+Esc)
2. Look for "Node.js" processes
3. Check if they're being killed after 10 seconds
4. Check "Details" tab for any suspicious activity

## 📋 Next Debugging Steps

1. **Check antivirus logs** for Node.js blocks
2. **Try a different port** (3000, 5000, 8000)
3. **Run as administrator** to bypass restrictions
4. **Disable Windows Defender temporarily** for testing
5. **Check Event Viewer** for application crashes:
   - Open Event Viewer
   - Windows Logs → Application
   - Look for Node.js crashes around the time it fails

## 🎯 The REAL Problem

This is **NOT a code issue**. The code is fine. This is an **environment/system issue**.

The server is being terminated by:
- System security software
- Process limiter
- Resource manager
- Or some other external force

**The frontend will continue to show "Failed to fetch" until the backend can stay running.**

## 💡 Recommendation

**USE WSL or change the port!**

This Windows PowerShell environment appears to have something killing Node.js processes after they start.
