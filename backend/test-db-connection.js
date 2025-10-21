require('dotenv').config();
const { pool } = require('./src/db');

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully');
    console.log('Current time:', result.rows[0].current_time);
    
    // Check if pre_booking table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'pre_booking'
      ) as table_exists
    `);
    
    if (tableCheck.rows[0].table_exists) {
      console.log('✅ pre_booking table exists');
      
      // Check table structure
      const columns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'pre_booking' 
        ORDER BY ordinal_position
      `);
      
      console.log('Table columns:');
      columns.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });
      
      // Test the listPreBookings query
      console.log('\nTesting pre-bookings query...');
      const preBookings = await pool.query(`
        SELECT 
          pb.pre_booking_id,
          pb.guest_id,
          g.full_name as customer_name,
          pb.expected_check_in as check_in_date,
          pb.expected_check_out as check_out_date,
          pb.capacity as number_of_guests,
          pb.prebooking_method,
          pb.created_at,
          CASE 
            WHEN pb.room_id IS NOT NULL THEN 'Confirmed'
            ELSE 'Pending'
          END as status
        FROM pre_booking pb
        JOIN guest g ON g.guest_id = pb.guest_id
        ORDER BY pb.created_at DESC
        LIMIT 5
      `);
      
      console.log(`✅ Found ${preBookings.rows.length} pre-bookings`);
      if (preBookings.rows.length > 0) {
        console.log('Sample pre-booking:', preBookings.rows[0]);
      }
      
    } else {
      console.log('❌ pre_booking table does not exist');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await pool.end();
  }
}

testDatabaseConnection();
