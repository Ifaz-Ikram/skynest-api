// backend/scripts/add-customers.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'skynest',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '200320701070',
});

async function addCustomers() {
  console.log('🏨 Adding customers to SkyNest database...');
  
  try {
    // First, add some guests
    const guests = [
      {
        full_name: 'Anushka Mendis',
        email: 'anushka.mendis@email.com',
        phone: '0771234567',
        address: '123 Main Street, Colombo 03'
      },
      {
        full_name: 'Priya Silva',
        email: 'priya.silva@email.com',
        phone: '0777654321',
        address: '456 Galle Road, Colombo 04'
      },
      {
        full_name: 'Rajesh Kumar',
        email: 'rajesh.kumar@email.com',
        phone: '0779876543',
        address: '789 Kandy Road, Kandy'
      },
      {
        full_name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        phone: '0775555555',
        address: '321 Beach Road, Galle'
      },
      {
        full_name: 'Mohammed Ali',
        email: 'mohammed.ali@email.com',
        phone: '0774444444',
        address: '654 Negombo Road, Negombo'
      }
    ];

    const guestIds = [];
    
    for (const guest of guests) {
      try {
        const result = await pool.query(
          `INSERT INTO guest (full_name, email, phone, address)
           VALUES ($1, $2, $3, $4) RETURNING guest_id`,
          [guest.full_name, guest.email, guest.phone, guest.address]
        );
        guestIds.push(result.rows[0].guest_id);
        console.log(`✅ Created guest: ${guest.full_name}`);
      } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`ℹ️  Guest ${guest.full_name} already exists`);
          // Get existing guest ID
          const existingGuest = await pool.query(
            'SELECT guest_id FROM guest WHERE email = $1',
            [guest.email]
          );
          if (existingGuest.rows.length > 0) {
            guestIds.push(existingGuest.rows[0].guest_id);
          }
        } else {
          console.error(`❌ Error creating guest ${guest.full_name}:`, error.message);
        }
      }
    }

    // Now create customers linked to these guests
    for (let i = 0; i < guestIds.length; i++) {
      try {
        const result = await pool.query(
          `INSERT INTO customer (guest_id)
           VALUES ($1) RETURNING customer_id`,
          [guestIds[i]]
        );
        console.log(`✅ Created customer: ${guests[i].full_name} (Customer ID: ${result.rows[0].customer_id})`);
      } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`ℹ️  Customer for ${guests[i].full_name} already exists`);
        } else {
          console.error(`❌ Error creating customer for ${guests[i].full_name}:`, error.message);
        }
      }
    }

    console.log('🎉 Successfully added customers to the database!');
    
  } catch (error) {
    console.error('❌ Error adding customers:', error);
  } finally {
    await pool.end();
  }
}

addCustomers();
