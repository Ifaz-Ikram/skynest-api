/**
 * Seed Script for SkyNest Hotel
 * Creates test users for all roles: Admin, Manager, Receptionist, Accountant, Customer
 */

const bcrypt = require('bcrypt');
const { pool } = require('../src/db');

async function seedUsers() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...\n');
    
    await client.query('BEGIN');

    // Helper function to create employee
    async function createEmployee(username, password, role, fullName, email, phone, branchId = 1) {
      console.log(`Creating ${role}: ${username}...`);
      
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create user_account
      const userResult = await client.query(
        `INSERT INTO user_account (username, password_hash, role)
         VALUES ($1, $2, $3)
         RETURNING user_id`,
        [username, passwordHash, role]
      );
      const userId = userResult.rows[0].user_id;
      
      // Create employee record
      await client.query(
        `INSERT INTO employee (user_id, branch_id, name, email, contact_no)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, branchId, fullName, email, phone]
      );
      
      console.log(`✅ Created ${role}: ${username} (password: ${password})`);
      return userId;
    }

    // Helper function to create customer
    async function createCustomer(username, password, fullName, email, phone, address) {
      console.log(`Creating Customer: ${username}...`);
      
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create guest record
      const guestResult = await client.query(
        `INSERT INTO guest (full_name, email, phone, address)
         VALUES ($1, $2, $3, $4)
         RETURNING guest_id`,
        [fullName, email, phone, address]
      );
      const guestId = guestResult.rows[0].guest_id;
      
      // Create user_account
      const userResult = await client.query(
        `INSERT INTO user_account (username, password_hash, role, guest_id)
         VALUES ($1, $2, $3, $4)
         RETURNING user_id`,
        [username, passwordHash, 'Customer', guestId]
      );
      const userId = userResult.rows[0].user_id;
      
      // Create customer record
      await client.query(
        `INSERT INTO customer (user_id, guest_id)
         VALUES ($1, $2)`,
        [userId, guestId]
      );
      
      console.log(`✅ Created Customer: ${username} (password: ${password})`);
      return userId;
    }

    console.log('\n📋 Creating Employees...\n');
    
    // Create Managers
    await createEmployee(
      'john.manager',
      'manager123',
      'Manager',
      'John Manager',
      'john.manager@skynest.com',
      '+1234567890'
    );
    
    await createEmployee(
      'sarah.manager',
      'manager123',
      'Manager',
      'Sarah Manager',
      'sarah.manager@skynest.com',
      '+1234567891'
    );

    // Create Receptionists
    await createEmployee(
      'alice.receptionist',
      'reception123',
      'Receptionist',
      'Alice Receptionist',
      'alice.receptionist@skynest.com',
      '+1234567892'
    );
    
    await createEmployee(
      'bob.receptionist',
      'reception123',
      'Receptionist',
      'Bob Receptionist',
      'bob.receptionist@skynest.com',
      '+1234567893'
    );
    
    await createEmployee(
      'carol.receptionist',
      'reception123',
      'Receptionist',
      'Carol Receptionist',
      'carol.receptionist@skynest.com',
      '+1234567894'
    );

    // Create Accountants
    await createEmployee(
      'david.accountant',
      'accountant123',
      'Accountant',
      'David Accountant',
      'david.accountant@skynest.com',
      '+1234567895'
    );
    
    await createEmployee(
      'emma.accountant',
      'accountant123',
      'Accountant',
      'Emma Accountant',
      'emma.accountant@skynest.com',
      '+1234567896'
    );

    console.log('\n📋 Creating Customers...\n');

    // Create Customers
    await createCustomer(
      'james.customer',
      'customer123',
      'James Customer',
      'james@customer.com',
      '+1111111111',
      '123 Main St, City, State 12345'
    );
    
    await createCustomer(
      'lisa.customer',
      'customer123',
      'Lisa Customer',
      'lisa@customer.com',
      '+1111111112',
      '456 Oak Ave, City, State 12345'
    );
    
    await createCustomer(
      'mike.customer',
      'customer123',
      'Mike Customer',
      'mike@customer.com',
      '+1111111113',
      '789 Pine Rd, City, State 12345'
    );
    
    await createCustomer(
      'nancy.customer',
      'customer123',
      'Nancy Customer',
      'nancy@customer.com',
      '+1111111114',
      '321 Elm St, City, State 12345'
    );
    
    await createCustomer(
      'oliver.customer',
      'customer123',
      'Oliver Customer',
      'oliver@customer.com',
      '+1111111115',
      '654 Maple Dr, City, State 12345'
    );

    await client.query('COMMIT');
    
    console.log('\n✅ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log('  - 2 Managers');
    console.log('  - 3 Receptionists');
    console.log('  - 2 Accountants');
    console.log('  - 5 Customers');
    console.log('\n🔐 Login Credentials:');
    console.log('  Managers: john.manager / sarah.manager (password: manager123)');
    console.log('  Receptionists: alice.receptionist / bob.receptionist / carol.receptionist (password: reception123)');
    console.log('  Accountants: david.accountant / emma.accountant (password: accountant123)');
    console.log('  Customers: james.customer / lisa.customer / mike.customer / nancy.customer / oliver.customer (password: customer123)');
    console.log('  Admin: admin (password: admin123) - Already exists\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seed function
seedUsers()
  .then(() => {
    console.log('✨ Seed complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to seed database:', error);
    process.exit(1);
  });
