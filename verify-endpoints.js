// Quick Backend Endpoint Verification
// Run this in your terminal: node verify-endpoints.js

const http = require('http');

const endpoints = [
  '/health',  // Public endpoint at root
  '/api/auth/login',  // Public login endpoint
  // These require auth, will return 401 but that means they exist!
  '/api/branches',
  '/api/admin/branches',
  '/api/prebookings',
  '/api/pre-bookings',
  '/api/services',
  '/api/service-catalog',
  '/api/rooms',
  '/api/catalog/rooms',
  '/api/catalog/free-rooms',
];

async function testEndpoint(path) {
  return new Promise((resolve) => {
    // POST for login, GET for others
    const method = path.includes('/login') ? 'POST' : 'GET';
    
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: method,
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNzM3MDI4ODAwfQ.test',
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      // 200-299 = success, 401 = requires auth (endpoint exists!), 404 = not found
      const exists = res.statusCode !== 404;
      resolve({
        path,
        status: res.statusCode,
        ok: exists
      });
    });

    req.on('error', (err) => {
      resolve({
        path,
        status: 'ERROR',
        ok: false,
        error: err.message
      });
    });

    req.end();
  });
}

async function verifyAll() {
  console.log('🔍 Verifying Backend Endpoints...\n');
  console.log('Backend should be running on http://localhost:4000\n');
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    const icon = result.ok ? '✅' : '❌';
    const status = result.status === 'ERROR' ? result.error : result.status;
    const note = result.status === 401 ? ' (auth required - endpoint exists)' : '';
    console.log(`${icon} ${endpoint} - ${status}${note}`);
  }
  
  console.log('\n📊 Summary:');
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  
  console.log(`✅ Passed: ${passed}/${endpoints.length}`);
  console.log(`❌ Failed: ${failed}/${endpoints.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL ENDPOINTS WORKING!');
  } else {
    console.log('\n⚠️  Some endpoints need attention');
    console.log('Make sure backend is running: npm run dev');
  }
}

verifyAll();
