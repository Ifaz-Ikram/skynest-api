// Clear all bookings and seed with realistic Sri Lankan hotel data
require("dotenv").config({ quiet: true });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'skynest',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '200320701070',
});

async function clearAllData() {
  console.log('🗑️  Clearing all existing data...');
  
  // Clear in reverse dependency order to avoid foreign key violations
  await pool.query('DELETE FROM service_usage');
  await pool.query('DELETE FROM payment');
  await pool.query('DELETE FROM booking');
  await pool.query('DELETE FROM pre_booking');
  await pool.query('DELETE FROM customer'); // Clear customers first
  await pool.query('DELETE FROM employee'); // Clear employees
  await pool.query('DELETE FROM user_account'); // Clear user accounts
  await pool.query('DELETE FROM guest');
  await pool.query('DELETE FROM room');
  await pool.query('DELETE FROM room_type');
  await pool.query('DELETE FROM service_catalog');
  await pool.query('DELETE FROM branch');
  
  console.log('✅ All data cleared');
}

async function seedSriLankanData() {
  console.log('🇱🇰 Seeding Sri Lankan hotel data...');

  // 1. Create Sri Lankan hotel branches
  const branches = [
    {
      branch_name: 'SkyNest Colombo',
      branch_code: 'CMB',
      contact_number: '+94 11 234 5678',
      address: '123 Galle Road, Colombo 03, Sri Lanka',
      manager_name: 'Priya Fernando'
    },
    {
      branch_name: 'SkyNest Kandy',
      branch_code: 'KND',
      contact_number: '+94 81 234 5678',
      address: '456 Peradeniya Road, Kandy, Sri Lanka',
      manager_name: 'Rajesh Perera'
    },
    {
      branch_name: 'SkyNest Galle',
      branch_code: 'GAL',
      contact_number: '+94 91 234 5678',
      address: '789 Church Street, Galle Fort, Sri Lanka',
      manager_name: 'Nimali Silva'
    },
    {
      branch_name: 'SkyNest Negombo',
      branch_code: 'NEG',
      contact_number: '+94 31 234 5678',
      address: '321 Lewis Place, Negombo, Sri Lanka',
      manager_name: 'Kamal Jayasuriya'
    }
  ];

  const branchIds = {};
  for (const branch of branches) {
    const result = await pool.query(
      `INSERT INTO branch (branch_name, branch_code, contact_number, address, manager_name)
       VALUES ($1, $2, $3, $4, $5) RETURNING branch_id`,
      [branch.branch_name, branch.branch_code, branch.contact_number, branch.address, branch.manager_name]
    );
    branchIds[branch.branch_code] = result.rows[0].branch_id;
    console.log(`✅ Created branch: ${branch.branch_name}`);
  }

  // 2. Create room types with Sri Lankan pricing (in LKR)
  const roomTypes = [
    {
      name: 'Standard Room',
      capacity: 2,
      daily_rate: 15000.00,
      amenities: 'AC, TV, WiFi, Mini Bar'
    },
    {
      name: 'Deluxe Room',
      capacity: 3,
      daily_rate: 25000.00,
      amenities: 'AC, TV, WiFi, Mini Bar, Balcony, Sea View'
    },
    {
      name: 'Executive Suite',
      capacity: 4,
      daily_rate: 45000.00,
      amenities: 'AC, TV, WiFi, Mini Bar, Balcony, Sea View, Living Area, Kitchenette'
    },
    {
      name: 'Presidential Suite',
      capacity: 6,
      daily_rate: 75000.00,
      amenities: 'AC, TV, WiFi, Mini Bar, Balcony, Sea View, Living Area, Kitchenette, Jacuzzi, Butler Service'
    },
    {
      name: 'Family Room',
      capacity: 5,
      daily_rate: 35000.00,
      amenities: 'AC, TV, WiFi, Mini Bar, Balcony, Connecting Rooms'
    }
  ];

  const roomTypeIds = {};
  for (const roomType of roomTypes) {
    const result = await pool.query(
      `INSERT INTO room_type (name, capacity, daily_rate, amenities)
       VALUES ($1, $2, $3, $4) RETURNING room_type_id`,
      [roomType.name, roomType.capacity, roomType.daily_rate, roomType.amenities]
    );
    roomTypeIds[roomType.name] = result.rows[0].room_type_id;
    console.log(`✅ Created room type: ${roomType.name}`);
  }

  // 3. Create rooms for each branch
  const rooms = [];
  const roomNumbers = ['101', '102', '103', '104', '105', '201', '202', '203', '204', '205', '301', '302', '303', '304', '305'];
  
  for (const [branchCode, branchId] of Object.entries(branchIds)) {
    for (let i = 0; i < 15; i++) {
      const roomNumber = roomNumbers[i];
      const roomTypeName = i < 3 ? 'Standard Room' : 
                          i < 6 ? 'Deluxe Room' : 
                          i < 9 ? 'Executive Suite' : 
                          i < 12 ? 'Family Room' : 'Presidential Suite';
      
      const result = await pool.query(
        `INSERT INTO room (branch_id, room_type_id, room_number, status)
         VALUES ($1, $2, $3, 'Available') RETURNING room_id`,
        [branchId, roomTypeIds[roomTypeName], roomNumber]
      );
      
      rooms.push({
        room_id: result.rows[0].room_id,
        branch_id: branchId,
        room_number: roomNumber,
        room_type: roomTypeName
      });
    }
    console.log(`✅ Created 15 rooms for ${branchCode}`);
  }

  // 4. Create service catalog
  const services = [
    {
      code: 'BREAKFAST',
      name: 'Continental Breakfast',
      category: 'Food & Beverage',
      unit_price: 2500.00,
      tax_rate_percent: 15,
      active: true
    },
    {
      code: 'LAUNDRY',
      name: 'Laundry Service',
      category: 'Housekeeping',
      unit_price: 1500.00,
      tax_rate_percent: 15,
      active: true
    },
    {
      code: 'SPA',
      name: 'Spa Treatment',
      category: 'Wellness',
      unit_price: 8000.00,
      tax_rate_percent: 15,
      active: true
    },
    {
      code: 'AIRPORT',
      name: 'Airport Transfer',
      category: 'Transportation',
      unit_price: 5000.00,
      tax_rate_percent: 15,
      active: true
    },
    {
      code: 'TOUR',
      name: 'City Tour',
      category: 'Activities',
      unit_price: 12000.00,
      tax_rate_percent: 15,
      active: true
    }
  ];

  const serviceIds = {};
  for (const service of services) {
    const result = await pool.query(
      `INSERT INTO service_catalog (code, name, category, unit_price, tax_rate_percent, active)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING service_id`,
      [service.code, service.name, service.category, service.unit_price, service.tax_rate_percent, service.active]
    );
    serviceIds[service.code] = result.rows[0].service_id;
    console.log(`✅ Created service: ${service.name}`);
  }

  // 5. Create realistic Sri Lankan guests
  const guests = [
    {
      full_name: 'Nimali Perera',
      email: 'nimali.perera@gmail.com',
      phone: '+94 77 123 4567',
      address: '123/5, Galle Road, Colombo 03'
    },
    {
      full_name: 'Rajesh Fernando',
      email: 'rajesh.fernando@yahoo.com',
      phone: '+94 71 234 5678',
      address: '456, Kandy Road, Peradeniya'
    },
    {
      full_name: 'Priya Silva',
      email: 'priya.silva@hotmail.com',
      phone: '+94 76 345 6789',
      address: '789, Church Street, Galle Fort'
    },
    {
      full_name: 'Kamal Jayasuriya',
      email: 'kamal.jayasuriya@gmail.com',
      phone: '+94 75 456 7890',
      address: '321, Lewis Place, Negombo'
    },
    {
      full_name: 'Samantha Wickramasinghe',
      email: 'samantha.wickramasinghe@outlook.com',
      phone: '+94 78 567 8901',
      address: '654, Horton Place, Colombo 07'
    },
    {
      full_name: 'Dinesh Karunaratne',
      email: 'dinesh.karunaratne@gmail.com',
      phone: '+94 72 678 9012',
      address: '987, Temple Road, Kandy'
    },
    {
      full_name: 'Anushka Mendis',
      email: 'anushka.mendis@yahoo.com',
      phone: '+94 77 789 0123',
      address: '147, Lighthouse Street, Galle'
    },
    {
      full_name: 'Tharindu Bandara',
      email: 'tharindu.bandara@gmail.com',
      phone: '+94 71 890 1234',
      address: '258, Beach Road, Negombo'
    },
    {
      full_name: 'Chamari Athapaththu',
      email: 'chamari.athapaththu@hotmail.com',
      phone: '+94 76 901 2345',
      address: '369, Independence Avenue, Colombo 07'
    },
    {
      full_name: 'Lasith Malinga',
      email: 'lasith.malinga@gmail.com',
      phone: '+94 75 012 3456',
      address: '741, Galle Face Green, Colombo 03'
    }
  ];

  const guestIds = {};
  for (const guest of guests) {
    const result = await pool.query(
      `INSERT INTO guest (full_name, email, phone, address)
       VALUES ($1, $2, $3, $4) RETURNING guest_id`,
      [guest.full_name, guest.email, guest.phone, guest.address]
    );
    guestIds[guest.full_name] = result.rows[0].guest_id;
    console.log(`✅ Created guest: ${guest.full_name}`);
  }

  // 6. Create some realistic bookings
  const bookings = [
    {
      guest_name: 'Nimali Perera',
      room_number: '101',
      branch_code: 'CMB',
      check_in_date: '2025-10-20',
      check_out_date: '2025-10-22',
      status: 'Booked',
      booked_rate: 15000.00,
      advance_payment: 30000.00
    },
    {
      guest_name: 'Rajesh Fernando',
      room_number: '201',
      branch_code: 'KND',
      check_in_date: '2025-10-21',
      check_out_date: '2025-10-24',
      status: 'Checked-In',
      booked_rate: 25000.00,
      advance_payment: 50000.00
    },
    {
      guest_name: 'Priya Silva',
      room_number: '301',
      branch_code: 'GAL',
      check_in_date: '2025-10-25',
      check_out_date: '2025-10-27',
      status: 'Booked',
      booked_rate: 45000.00,
      advance_payment: 90000.00
    },
    {
      guest_name: 'Kamal Jayasuriya',
      room_number: '102',
      branch_code: 'NEG',
      check_in_date: '2025-10-18',
      check_out_date: '2025-10-20',
      status: 'Checked-Out',
      booked_rate: 15000.00,
      advance_payment: 30000.00
    },
    {
      guest_name: 'Samantha Wickramasinghe',
      room_number: '401',
      branch_code: 'CMB',
      check_in_date: '2025-10-30',
      check_out_date: '2025-11-02',
      status: 'Booked',
      booked_rate: 35000.00,
      advance_payment: 70000.00
    }
  ];

  for (const booking of bookings) {
    const guestId = guestIds[booking.guest_name];
    const room = rooms.find(r => r.room_number === booking.room_number && r.branch_id === branchIds[booking.branch_code]);
    
    if (guestId && room) {
      const result = await pool.query(
        `INSERT INTO booking (guest_id, room_id, check_in_date, check_out_date, status, booked_rate, advance_payment, tax_rate_percent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 15) RETURNING booking_id`,
        [guestId, room.room_id, booking.check_in_date, booking.check_out_date, booking.status, booking.booked_rate, booking.advance_payment]
      );
      
      // Add some payments for completed bookings
      if (booking.status === 'Checked-Out') {
        await pool.query(
          `INSERT INTO payment (booking_id, amount, method, paid_at, payment_reference)
           VALUES ($1, $2, 'Cash', NOW(), 'PAY-${result.rows[0].booking_id}')`,
          [result.rows[0].booking_id, booking.booked_rate * 2] // 2 nights
        );
      }
      
      console.log(`✅ Created booking for ${booking.guest_name} at ${booking.branch_code}`);
    }
  }

  // 7. Add some service usage
  const serviceUsages = [
    {
      guest_name: 'Rajesh Fernando',
      service_code: 'BREAKFAST',
      quantity: 2,
      used_on: '2025-10-22'
    },
    {
      guest_name: 'Rajesh Fernando',
      service_code: 'LAUNDRY',
      quantity: 1,
      used_on: '2025-10-23'
    },
    {
      guest_name: 'Kamal Jayasuriya',
      service_code: 'AIRPORT',
      quantity: 1,
      used_on: '2025-10-18'
    }
  ];

  for (const usage of serviceUsages) {
    const guestId = guestIds[usage.guest_name];
    const serviceId = serviceIds[usage.service_code];
    
    if (guestId && serviceId) {
      // Find the booking for this guest
      const bookingResult = await pool.query(
        `SELECT booking_id FROM booking WHERE guest_id = $1 ORDER BY booking_id DESC LIMIT 1`,
        [guestId]
      );
      
      if (bookingResult.rows.length > 0) {
        const service = services.find(s => s.code === usage.service_code);
        await pool.query(
          `INSERT INTO service_usage (booking_id, service_id, used_on, qty, unit_price_at_use)
           VALUES ($1, $2, $3, $4, $5)`,
          [bookingResult.rows[0].booking_id, serviceId, usage.used_on, usage.quantity, service.unit_price]
        );
        console.log(`✅ Added service usage: ${usage.service_code} for ${usage.guest_name}`);
      }
    }
  }

  console.log('🎉 Sri Lankan hotel data seeded successfully!');
}

async function main() {
  try {
    await clearAllData();
    await seedSriLankanData();
    
    console.log('\n📊 Database Summary:');
    const branchCount = await pool.query('SELECT COUNT(*) FROM branch');
    const roomCount = await pool.query('SELECT COUNT(*) FROM room');
    const guestCount = await pool.query('SELECT COUNT(*) FROM guest');
    const bookingCount = await pool.query('SELECT COUNT(*) FROM booking');
    
    console.log(`🏨 Branches: ${branchCount.rows[0].count}`);
    console.log(`🛏️  Rooms: ${roomCount.rows[0].count}`);
    console.log(`👥 Guests: ${guestCount.rows[0].count}`);
    console.log(`📅 Bookings: ${bookingCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { clearAllData, seedSriLankanData };
