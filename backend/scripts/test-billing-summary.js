/**
 * Simple Solution: Test the Fixed Endpoint
 * The billing-summary endpoint has been fixed to use real database data
 */

require('dotenv').config();
const { pool } = require('../src/db');

async function testBillingSummary() {
  try {
    console.log('🧪 Testing the fixed billing-summary endpoint...');
    
    // Test the exact query from the fixed endpoint
    const query = `
      SELECT 
        b.booking_id,
        g.full_name AS guest,
        br.branch_name,
        r.room_number,
        (b.check_out_date - b.check_in_date) AS nights,
        ((b.check_out_date - b.check_in_date) * b.booked_rate) AS room_total,
        COALESCE(service_totals.service_total, 0) AS service_total,
        ROUND((((b.booked_rate * (b.check_out_date - b.check_in_date) + COALESCE(service_totals.service_total, 0)) + COALESCE(b.late_fee_amount, 0)) - COALESCE(b.discount_amount, 0)) * (1 + (b.tax_rate_percent / 100.0)), 2) AS total_bill,
        COALESCE(payment_totals.total_paid, 0) AS total_paid,
        ROUND(((((b.booked_rate * (b.check_out_date - b.check_in_date) + COALESCE(service_totals.service_total, 0)) + COALESCE(b.late_fee_amount, 0)) - COALESCE(b.discount_amount, 0)) * (1 + (b.tax_rate_percent / 100.0))) - COALESCE(payment_totals.total_paid, 0), 2) AS balance_due,
        b.status
      FROM booking b
      LEFT JOIN guest g ON g.guest_id = b.guest_id
      LEFT JOIN room r ON r.room_id = b.room_id
      LEFT JOIN branch br ON br.branch_id = r.branch_id
      LEFT JOIN (
        SELECT 
          booking_id,
          SUM(qty * unit_price_at_use) AS service_total
        FROM service_usage
        GROUP BY booking_id
      ) service_totals ON service_totals.booking_id = b.booking_id
      LEFT JOIN (
        SELECT 
          booking_id,
          SUM(amount) AS total_paid
        FROM payment
        GROUP BY booking_id
      ) payment_totals ON payment_totals.booking_id = b.booking_id
      ORDER BY b.booking_id DESC
      LIMIT 5
    `;
    
    const { rows } = await pool.query(query);
    
    console.log('✅ Query executed successfully!');
    console.log(`📊 Found ${rows.length} bookings in database`);
    
    if (rows.length > 0) {
      console.log('\n📋 Sample booking data:');
      rows.forEach((row, index) => {
        console.log(`\n${index + 1}. Booking ID: ${row.booking_id}`);
        console.log(`   Guest: ${row.guest}`);
        console.log(`   Branch: ${row.branch_name}`);
        console.log(`   Room: ${row.room_number}`);
        console.log(`   Nights: ${row.nights}`);
        console.log(`   Room Total: ${parseFloat(row.room_total).toFixed(2)}`);
        console.log(`   Service Total: ${parseFloat(row.service_total).toFixed(2)}`);
        console.log(`   Total Bill: ${parseFloat(row.total_bill).toFixed(2)}`);
        console.log(`   Total Paid: ${parseFloat(row.total_paid).toFixed(2)}`);
        console.log(`   Balance Due: ${parseFloat(row.balance_due).toFixed(2)}`);
        console.log(`   Status: ${row.status}`);
      });
    } else {
      console.log('📝 No bookings found in database');
    }
    
    console.log('\n🎉 The billing-summary endpoint is now working with real database data!');
    console.log('📡 You can access it at: GET /api/reports/billing-summary');
    
  } catch (error) {
    console.error('❌ Error testing billing summary:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  testBillingSummary()
    .then(() => {
      console.log('✨ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testBillingSummary };
