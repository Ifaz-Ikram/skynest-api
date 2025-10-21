/**
 * Comprehensive Demo Data Seed
 * Creates: 1 user per role + branches + rooms + bookings with services/payments
 */

require('dotenv').config();
const { pool } = require('../../src/db');
const bcrypt = require('bcryptjs');

async function seedDemoData() {
  try {
    console.log('🌱 Seeding comprehensive demo data...\n');

    // ========== 1. CREATE USERS (1 per role) ==========
    console.log('👥 Creating users...');
    const users = {};
    const userPasswords = {};
    
    const roles = ['Admin', 'Manager', 'Receptionist', 'Accountant', 'Customer'];
    for (const role of roles) {
      const username = role.toLowerCase();
      const password = `${username}123`;
      const hash = await bcrypt.hash(password, 10);
      
      const { rows } = await pool.query(
        `INSERT INTO user_account (username, password_hash, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (username) DO UPDATE SET role = EXCLUDED.role
         RETURNING user_id, username, role`,
        [username, hash, role]
      );
      users[role] = rows[0];
      userPasswords[role] = password;
      console.log(`  ✅ ${role}: ${username} (password: ${password})`);
    }

    // ========== 2. CREATE BRANCH ==========
    console.log('\n🏢 Creating branch...');
    
    // Check if branch already exists
    const existingBranch = await pool.query(
      `SELECT branch_id, branch_name FROM branch WHERE branch_name = 'SkyNest Headquarters'`
    );
    
    let branch;
    if (existingBranch.rows.length > 0) {
      branch = existingBranch.rows[0];
      console.log(`  ℹ️  Branch already exists: ${branch.branch_name} (ID: ${branch.branch_id})`);
    } else {
      const { rows: [newBranch] } = await pool.query(
        `INSERT INTO branch (branch_name, contact_number, address, manager_name, branch_code)
         VALUES ('SkyNest Headquarters', '+94112345678', '123 Main St, Colombo', 'Jane Manager', 'SNH001')
         RETURNING branch_id, branch_name`
      );
      branch = newBranch;
      console.log(`  ✅ Branch: ${branch.branch_name} (ID: ${branch.branch_id})`);
    }

    // ========== 3. CREATE ROOM TYPES ==========
    console.log('\n🛏️  Creating room types...');
    const roomTypes = [];
    const typeData = [
      { name: 'Standard', capacity: 2, rate: 5000.00 },
      { name: 'Deluxe', capacity: 2, rate: 8000.00 },
      { name: 'Suite', capacity: 4, rate: 12000.00 }
    ];
    
    for (const type of typeData) {
      const { rows } = await pool.query(
        `INSERT INTO room_type (name, capacity, daily_rate, amenities)
         VALUES ($1, $2, $3, 'AC, TV, WiFi')
         ON CONFLICT (name) DO NOTHING
         RETURNING room_type_id, name, daily_rate`,
        [type.name, type.capacity, type.rate]
      );
      if (rows[0]) {
        roomTypes.push(rows[0]);
        console.log(`  ✅ ${rows[0].name}: $${rows[0].daily_rate}/night`);
      }
    }

    // ========== 4. CREATE ROOMS ==========
    console.log('\n🚪 Creating rooms...');
    const rooms = [];
    for (let i = 0; i < roomTypes.length; i++) {
      for (let j = 1; j <= 3; j++) {
        const roomNumber = `${i + 1}0${j}`;
        const { rows } = await pool.query(
          `INSERT INTO room (branch_id, room_type_id, room_number, status)
           VALUES ($1, $2, $3, 'Available')
           RETURNING room_id, room_number`,
          [branch.branch_id, roomTypes[i].room_type_id, roomNumber]
        );
        if (rows[0]) {
          rooms.push({ ...rows[0], room_type_id: roomTypes[i].room_type_id, rate: roomTypes[i].daily_rate });
          console.log(`  ✅ Room ${rows[0].room_number}`);
        }
      }
    }

    // ========== 5. CREATE GUEST (for Customer user) ==========
    console.log('\n🧑 Creating guest...');
    const { rows: [guest] } = await pool.query(
      `INSERT INTO guest (id_proof_type, id_proof_number, full_name, email, phone, gender, address, nationality)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING guest_id, full_name`,
      ['NIC', '123456789V', 'John Customer', 'customer@example.com', '+94771234567', 'Male', '456 Beach Rd, Galle', 'Sri Lankan']
    );
    
    // Link guest to Customer user
    await pool.query(
      `UPDATE user_account SET guest_id = $1 WHERE user_id = $2`,
      [guest.guest_id, users.Customer.user_id]
    );
    
    // Create customer record
    await pool.query(
      `INSERT INTO customer (user_id, guest_id) VALUES ($1, $2)`,
      [users.Customer.user_id, guest.guest_id]
    );
    
    console.log(`  ✅ Guest: ${guest.full_name} (ID: ${guest.guest_id})`);

    // ========== 6. CREATE EMPLOYEE (for Manager user) ==========
    console.log('\n💼 Creating employee...');
    const { rows: [employee] } = await pool.query(
      `INSERT INTO employee (user_id, branch_id, name, email, contact_no)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING employee_id, name`,
      [users.Manager.user_id, branch.branch_id, 'Jane Manager', 'manager@skynest.com', '+94771234568']
    );
    
    console.log(`  ✅ Employee: ${employee.name} (ID: ${employee.employee_id})`);

    // ========== 7. CREATE SERVICE CATALOG ==========
    console.log('\n🍽️  Creating service catalog...');
    const services = [];
    const serviceData = [
      { code: 'LAUNDRY', name: 'Laundry Service', category: 'Housekeeping', price: 500.00 },
      { code: 'BREAKFAST', name: 'Breakfast', category: 'F&B', price: 1200.00 },
      { code: 'MINIBAR', name: 'Mini Bar', category: 'F&B', price: 800.00 },
      { code: 'SPA', name: 'Spa Treatment', category: 'Wellness', price: 3000.00 },
      { code: 'AIRPORT', name: 'Airport Transfer', category: 'Transport', price: 2500.00 }
    ];
    
    for (const svc of serviceData) {
      const { rows } = await pool.query(
        `INSERT INTO service_catalog (code, name, category, unit_price, tax_rate_percent, active)
         VALUES ($1, $2, $3, $4, 10.00, true)
         ON CONFLICT DO NOTHING
         RETURNING service_id, name, unit_price`,
        [svc.code, svc.name, svc.category, svc.price]
      );
      if (rows[0]) {
        services.push(rows[0]);
        console.log(`  ✅ ${rows[0].name}: $${rows[0].unit_price}`);
      }
    }

    // ========== 8. CREATE BOOKINGS ==========
    console.log('\n📅 Creating bookings...');
    const bookings = [];
    
    // Booking 1: Upcoming (Booked status)
    const checkIn1 = new Date();
    checkIn1.setDate(checkIn1.getDate() + 3);
    const checkOut1 = new Date(checkIn1);
    checkOut1.setDate(checkOut1.getDate() + 2);
    const nights1 = 2;
    const roomCharges1 = nights1 * rooms[0].rate;
    const minAdvance1 = roomCharges1 * 0.10;
    const advance1 = Math.ceil(minAdvance1 / 100) * 100; // Round up to nearest 100
    
    const { rows: [booking1] } = await pool.query(
      `INSERT INTO booking (guest_id, room_id, check_in_date, check_out_date, booked_rate, status, tax_rate_percent, advance_payment)
       VALUES ($1, $2, $3, $4, $5, 'Booked', 10.00, $6)
       RETURNING booking_id, check_in_date, check_out_date`,
      [guest.guest_id, rooms[0].room_id, checkIn1.toISOString().split('T')[0], checkOut1.toISOString().split('T')[0], rooms[0].rate, advance1]
    );
    bookings.push(booking1);
    console.log(`  ✅ Booking #${booking1.booking_id}: ${booking1.check_in_date} to ${booking1.check_out_date} (Upcoming)`);

    // Booking 2: Current (Checked-In status)
    const checkIn2 = new Date();
    checkIn2.setDate(checkIn2.getDate() - 1);
    const checkOut2 = new Date(checkIn2);
    checkOut2.setDate(checkOut2.getDate() + 3);
    const nights2 = 3;
    const roomCharges2 = nights2 * rooms[1].rate;
    const minAdvance2 = roomCharges2 * 0.10;
    const advance2 = Math.ceil(minAdvance2 / 100) * 100;
    
    const { rows: [booking2] } = await pool.query(
      `INSERT INTO booking (guest_id, room_id, check_in_date, check_out_date, booked_rate, status, tax_rate_percent, discount_amount, advance_payment)
       VALUES ($1, $2, $3, $4, $5, 'Checked-In', 10.00, 500.00, $6)
       RETURNING booking_id, check_in_date, check_out_date`,
      [guest.guest_id, rooms[1].room_id, checkIn2.toISOString().split('T')[0], checkOut2.toISOString().split('T')[0], rooms[1].rate, advance2]
    );
    bookings.push(booking2);
    console.log(`  ✅ Booking #${booking2.booking_id}: ${booking2.check_in_date} to ${booking2.check_out_date} (Current)`);
    
    // Update room status
    await pool.query(`UPDATE room SET status = 'Occupied' WHERE room_id = $1`, [rooms[1].room_id]);

    // Booking 3: Past (Checked-Out status)
    const checkIn3 = new Date();
    checkIn3.setDate(checkIn3.getDate() - 10);
    const checkOut3 = new Date(checkIn3);
    checkOut3.setDate(checkOut3.getDate() + 3);
    const nights3 = 3;
    const roomCharges3 = nights3 * rooms[2].rate;
    const minAdvance3 = roomCharges3 * 0.10;
    const advance3 = Math.ceil(minAdvance3 / 100) * 100;
    
    const { rows: [booking3] } = await pool.query(
      `INSERT INTO booking (guest_id, room_id, check_in_date, check_out_date, booked_rate, status, tax_rate_percent, late_fee_amount, advance_payment)
       VALUES ($1, $2, $3, $4, $5, 'Checked-Out', 10.00, 200.00, $6)
       RETURNING booking_id, check_in_date, check_out_date`,
      [guest.guest_id, rooms[2].room_id, checkIn3.toISOString().split('T')[0], checkOut3.toISOString().split('T')[0], rooms[2].rate, advance3]
    );
    bookings.push(booking3);
    console.log(`  ✅ Booking #${booking3.booking_id}: ${booking3.check_in_date} to ${booking3.check_out_date} (Past)`);

    // ========== 9. ADD SERVICE USAGE ==========
    console.log('\n🧾 Adding service usage...');
    
    // Booking 2 services
    for (let i = 0; i < 3; i++) {
      const { rows } = await pool.query(
        `INSERT INTO service_usage (booking_id, service_id, used_on, qty, unit_price_at_use)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING service_usage_id`,
        [booking2.booking_id, services[i].service_id, checkIn2.toISOString().split('T')[0], Math.floor(Math.random() * 3) + 1, services[i].unit_price]
      );
      console.log(`  ✅ Service #${rows[0].service_usage_id} for Booking #${booking2.booking_id}`);
    }
    
    // Booking 3 services
    for (let i = 0; i < 2; i++) {
      await pool.query(
        `INSERT INTO service_usage (booking_id, service_id, used_on, qty, unit_price_at_use)
         VALUES ($1, $2, $3, $4, $5)`,
        [booking3.booking_id, services[i].service_id, checkIn3.toISOString().split('T')[0], 1, services[i].unit_price]
      );
    }

    // ========== 10. ADD PAYMENTS ==========
    console.log('\n💳 Adding payments...');
    
    // Payment for booking 3
    const { rows: [payment] } = await pool.query(
      `INSERT INTO payment (booking_id, amount, method, payment_reference, paid_at)
       VALUES ($1, 10000.00, 'Card', 'REF12345', NOW())
       RETURNING payment_id, amount`,
      [booking3.booking_id]
    );
    console.log(`  ✅ Payment #${payment.payment_id}: $${payment.amount} for Booking #${booking3.booking_id}`);

    // ========== 11. ADD ADJUSTMENTS ==========
    console.log('\n🔧 Adding adjustments...');
    const { rows: [adjustment] } = await pool.query(
      `INSERT INTO payment_adjustment (booking_id, amount, type, reference_note)
       VALUES ($1, 100.00, 'refund', 'Service quality compensation')
       RETURNING adjustment_id`,
      [booking3.booking_id]
    );
    console.log(`  ✅ Adjustment #${adjustment.adjustment_id}: $100 refund for Booking #${booking3.booking_id}`);

    console.log('\n✅ Demo data seeding complete!\n');
    console.log('📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const role of roles) {
      const username = role.toLowerCase();
      console.log(`${role.padEnd(15)} → ${username} / ${userPasswords[role]}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedDemoData()
    .then(() => {
      console.log('🎉 Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seed failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDemoData };
