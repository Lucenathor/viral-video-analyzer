import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function seedAdmin() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  const email = 'admin@viralpro.io';
  const password = 'ViralPro2024!';
  const name = 'Adrian Lucena';
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);
  
  // Check if admin already exists by email
  const [existing] = await connection.execute(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );
  
  if (existing.length > 0) {
    // Update existing user with password
    await connection.execute(
      'UPDATE users SET passwordHash = ?, role = ? WHERE email = ?',
      [passwordHash, 'admin', email]
    );
    console.log(`✅ Updated existing admin account: ${email}`);
  } else {
    // Create new admin
    const openId = `pwd_admin_${Date.now()}`;
    await connection.execute(
      'INSERT INTO users (openId, name, email, passwordHash, loginMethod, role, lastSignedIn) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [openId, name, email, passwordHash, 'password', 'admin']
    );
    console.log(`✅ Created admin account: ${email}`);
  }
  
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: ${password}`);
  
  await connection.end();
}

seedAdmin().catch(console.error);
