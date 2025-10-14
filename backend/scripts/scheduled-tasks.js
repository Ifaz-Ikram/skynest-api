/**
 * Scheduled Tasks for SkyNest Hotel
 * 
 * This script runs automated tasks like:
 * - Sending check-in reminders (1 day before)
 * - Sending invoices for checked-out bookings
 * - Updating room statuses
 * 
 * Usage:
 * 1. Run manually: node scripts/scheduled-tasks.js
 * 2. Set up cron job: Add to crontab -e
 *    0 9 * * * cd /path/to/skynest-api && node scripts/scheduled-tasks.js
 *    (Runs daily at 9:00 AM)
 * 
 * Or use a task scheduler like node-cron for in-app scheduling
 */

require('dotenv').config();
const pool = require('../src/db');
const { sendCheckInReminder, sendInvoiceEmail } = require('../src/utils/email');

/**
 * Send check-in reminders for bookings tomorrow
 */
async function sendCheckInReminders() {
  console.log('🔔 Checking for check-in reminders...');
  
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    const query = `
      SELECT booking_id, check_in_date
      FROM booking
      WHERE check_in_date = $1 AND status = 'Booked'
    `;

    const result = await pool.query(query, [tomorrowDate]);
    
    if (result.rows.length === 0) {
      console.log('✅ No check-ins tomorrow');
      return;
    }

    console.log(`📧 Found ${result.rows.length} booking(s) checking in tomorrow`);

    for (const booking of result.rows) {
      try {
        const emailResult = await sendCheckInReminder(booking.booking_id);
        if (emailResult.success) {
          console.log(`   ✅ Reminder sent for booking #${booking.booking_id}`);
        } else {
          console.log(`   ⚠️  Reminder not sent for booking #${booking.booking_id}: ${emailResult.reason}`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to send reminder for booking #${booking.booking_id}:`, error.message);
      }
    }

    console.log('✅ Check-in reminders complete');
  } catch (error) {
    console.error('❌ Error sending check-in reminders:', error);
  }
}

/**
 * Send invoices for recently checked-out bookings (no invoice sent yet)
 */
async function sendPendingInvoices() {
  console.log('📄 Checking for pending invoices...');
  
  try {
    // Get checked-out bookings from last 7 days that don't have invoice sent
    // (In production, track invoice_sent flag in database)
    const query = `
      SELECT 
        b.booking_id,
        b.check_out_date,
        b.status
      FROM booking b
      WHERE b.status = 'Checked-Out'
        AND b.check_out_date >= CURRENT_DATE - INTERVAL '7 days'
        AND NOT EXISTS (
          SELECT 1 FROM invoice i WHERE i.booking_id = b.booking_id
        )
      ORDER BY b.check_out_date DESC
    `;

    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      console.log('✅ No pending invoices');
      return;
    }

    console.log(`📧 Found ${result.rows.length} booking(s) needing invoices`);

    for (const booking of result.rows) {
      try {
        const emailResult = await sendInvoiceEmail(booking.booking_id);
        if (emailResult.success) {
          console.log(`   ✅ Invoice sent for booking #${booking.booking_id}`);
          
          // Mark invoice as sent (create invoice record)
          await pool.query(
            `INSERT INTO invoice (booking_id, created_at) VALUES ($1, NOW())
             ON CONFLICT (booking_id) DO NOTHING`,
            [booking.booking_id]
          );
        } else {
          console.log(`   ⚠️  Invoice not sent for booking #${booking.booking_id}: ${emailResult.reason}`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to send invoice for booking #${booking.booking_id}:`, error.message);
      }
    }

    console.log('✅ Invoice sending complete');
  } catch (error) {
    console.error('❌ Error sending invoices:', error);
  }
}

/**
 * Update room statuses based on booking status
 */
async function updateRoomStatuses() {
  console.log('🔄 Updating room statuses...');
  
  try {
    // Mark rooms as Available if booking is checked-out/cancelled
    const availableQuery = `
      UPDATE room
      SET status = 'Available'
      WHERE room_id IN (
        SELECT DISTINCT r.room_id
        FROM room r
        JOIN booking b ON r.room_id = b.room_id
        WHERE b.status IN ('Checked-Out', 'Cancelled')
          AND r.status = 'Occupied'
          AND NOT EXISTS (
            SELECT 1 FROM booking b2
            WHERE b2.room_id = r.room_id
              AND b2.status = 'Checked-In'
          )
      )
    `;
    
    const availableResult = await pool.query(availableQuery);
    console.log(`   ✅ Updated ${availableResult.rowCount} room(s) to Available`);

    // Mark rooms as Occupied if booking is checked-in
    const occupiedQuery = `
      UPDATE room
      SET status = 'Occupied'
      WHERE room_id IN (
        SELECT DISTINCT r.room_id
        FROM room r
        JOIN booking b ON r.room_id = b.room_id
        WHERE b.status = 'Checked-In'
          AND r.status != 'Occupied'
      )
    `;
    
    const occupiedResult = await pool.query(occupiedQuery);
    console.log(`   ✅ Updated ${occupiedResult.rowCount} room(s) to Occupied`);

    console.log('✅ Room status update complete');
  } catch (error) {
    console.error('❌ Error updating room statuses:', error);
  }
}

/**
 * Main function to run all scheduled tasks
 */
async function runScheduledTasks() {
  console.log('========================================');
  console.log('🏨 SkyNest Hotel - Scheduled Tasks');
  console.log(`📅 ${new Date().toLocaleString()}`);
  console.log('========================================\n');

  try {
    await sendCheckInReminders();
    console.log();
    
    await sendPendingInvoices();
    console.log();
    
    await updateRoomStatuses();
    console.log();

    console.log('========================================');
    console.log('✅ All scheduled tasks completed');
    console.log('========================================\n');
  } catch (error) {
    console.error('❌ Fatal error running scheduled tasks:', error);
  } finally {
    await pool.end();
  }
}

// Run tasks if executed directly
if (require.main === module) {
  runScheduledTasks();
}

module.exports = {
  sendCheckInReminders,
  sendPendingInvoices,
  updateRoomStatuses,
  runScheduledTasks
};
