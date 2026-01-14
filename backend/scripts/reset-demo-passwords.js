#!/usr/bin/env node
/**
 * Reset demo user passwords to known values
 */
const bcrypt = require('bcryptjs');
const { pool } = require('../src/db');

async function resetPasswords() {
  const users = [
    { username: 'admin', password: 'admin', role: 'Admin' },
    { username: 'manager_col', password: 'manager123', role: 'Manager' },
    { username: 'manager_gal', password: 'manager123', role: 'Manager' },
    { username: 'manager_kan', password: 'manager123', role: 'Manager' },
    { username: 'manager_neg', password: 'manager123', role: 'Manager' },
    { username: 'receptionist1', password: 'reception123', role: 'Receptionist' },
    { username: 'receptionist2', password: 'reception123', role: 'Receptionist' },
    { username: 'receptionist3', password: 'reception123', role: 'Receptionist' },
    { username: 'receptionist4', password: 'reception123', role: 'Receptionist' },
    { username: 'accountant1', password: 'accountant123', role: 'Accountant' },
    { username: 'accountant2', password: 'accountant123', role: 'Accountant' }
  ];

  console.log('🔄 Resetting demo user passwords...\n');

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    await pool.query(
      'UPDATE user_account SET password_hash = $1 WHERE username = $2',
      [hash, user.username]
    );
    console.log(`✅ Updated ${user.role}: ${user.username} (password: ${user.password})`);
  }
  
  console.log('\n✅ All demo passwords have been reset successfully!');
  console.log('\n📋 Demo Login Credentials:');
  console.log('========================');
  console.log('Managers:      username: manager_col/gal/kan/neg  password: manager123');
  console.log('Receptionists: username: receptionist1/2/3/4      password: reception123');
  console.log('Accountants:   username: accountant1/2            password: accountant123');
  
  await pool.end();
  process.exit(0);
}

resetPasswords().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
