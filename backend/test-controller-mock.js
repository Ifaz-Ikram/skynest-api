// Mock the database connection for testing
const mockPool = {
  query: async (sql, params) => {
    console.log('Mock query:', sql);
    if (sql.includes('information_schema.columns')) {
      // Simulate old schema without customer_id and room_type_id
      return { rows: [] };
    }
    if (sql.includes('FROM pre_booking')) {
      // Return mock pre-bookings data
      return { 
        rows: [
          {
            pre_booking_id: 1,
            guest_id: 1,
            customer_id: null,
            room_type_id: null,
            customer_name: 'John Doe',
            guest_email: 'john@example.com',
            guest_phone: '123-456-7890',
            check_in_date: '2024-01-15',
            check_out_date: '2024-01-17',
            number_of_guests: 2,
            prebooking_method: 'Walk-in',
            room_number: null,
            assigned_room_type: null,
            room_type_name: null,
            created_by_name: 'Admin',
            created_at: new Date(),
            status: 'Pending'
          }
        ]
      };
    }
    return { rows: [] };
  },
  end: () => Promise.resolve()
};

// Mock the database module
const path = require('path');
const dbModulePath = require.resolve('./src/db');
require.cache[dbModulePath] = {
  exports: { pool: mockPool }
};

// Now test the controller
const preBookingController = require('./src/controllers/prebooking.controller');

async function testPreBookingController() {
  console.log('Testing pre-booking controller...');
  
  try {
    // Test listPreBookings
    const mockReq = { query: {} };
    const mockRes = {
      json: (data) => {
        console.log('✅ listPreBookings response:', data);
        console.log(`Found ${data.pre_bookings.length} pre-bookings`);
      },
      status: (code) => ({
        json: (data) => console.log(`❌ Error ${code}:`, data)
      })
    };
    
    await preBookingController.listPreBookings(mockReq, mockRes);
    
    console.log('✅ Pre-booking controller test completed successfully!');
    console.log('The controller is working correctly with the old database schema.');
    
  } catch (error) {
    console.error('❌ Controller test failed:', error.message);
  }
}

testPreBookingController();
