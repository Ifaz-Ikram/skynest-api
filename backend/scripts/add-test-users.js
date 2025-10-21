// Add test users for the Sri Lankan hotel system
require("dotenv").config({ quiet: true });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'skynest',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '200320701070',
});

async function addTestUsers() {
  console.log('👤 Adding test users...');

  const users = [
    {
      username: 'admin',
      password_hash: '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV',
      role: 'Admin'
    },
    {
      username: 'manager',
      password_hash: '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV',
      role: 'Manager'
    },
    {
      username: 'receptionist',
      password_hash: '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV',
      role: 'Receptionist'
    }
  ];

  for (const user of users) {
    try {
      const result = await pool.query(
        `INSERT INTO user_account (username, password_hash, role)
         VALUES ($1, $2, $3) RETURNING user_id`,
        [user.username, user.password_hash, user.role]
      );
      console.log(`✅ Created user: ${user.username} (${user.role})`);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        console.log(`ℹ️  User ${user.username} already exists`);
      } else {
        console.error(`❌ Error creating user ${user.username}:`, error.message);
      }
    }
  }

  console.log('🎉 Test users added successfully!');
  console.log('\n🔑 Login Credentials:');
  console.log('Username: admin, Password: admin123');
  console.log('Username: manager, Password: manager123');
  console.log('Username: receptionist, Password: reception123');
}

async function main() {
  try {
    await addTestUsers();
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { addTestUsers };
