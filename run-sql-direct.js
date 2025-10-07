require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');

async function runSQL() {
  console.log('🚀 Deploying database schema directly via PostgreSQL...\n');

  // Extract connection info from Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)[1];

  // Supabase connection string format
  const connectionString = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

  console.log('Connecting to database...');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected!\n');

    // Read and execute SQL file
    const sql = fs.readFileSync('./CLEAN-SCHEMA-FIX.sql', 'utf8');

    console.log('Executing schema...');
    await client.query(sql);

    console.log('\n✅ Database schema deployed successfully!');
    console.log('   All tables, indexes, and RLS policies created.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

runSQL();
