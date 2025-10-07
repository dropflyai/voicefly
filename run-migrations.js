#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file');
  process.exit(1);
}

async function runMigration(filePath) {
  console.log(`\n📄 Running migration: ${path.basename(filePath)}`);

  try {
    const sql = fs.readFileSync(filePath, 'utf8');

    // Use Supabase's REST API to execute SQL
    const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;

    console.log(`   🔄 Executing SQL via Supabase REST API...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    console.log(`   ✅ Migration completed successfully`);
    return true;
  } catch (error) {
    console.error(`   ❌ Failed to run migration:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 VoiceFly Database Migration Tool\n');
  console.log(`📍 Database: irvyhhkoiyzartmmvbxw.supabase.co\n`);

  const migrations = [
    './CONSOLIDATED-DATABASE-SCHEMA.sql',
    './supabase-complete-schema.sql'
  ];

  for (const migration of migrations) {
    const filePath = path.join(__dirname, migration);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${migration}`);
      continue;
    }

    const success = await runMigration(filePath);
    if (!success) {
      console.log(`\n⚠️  Migration ${migration} had errors, but continuing...`);
    }
  }

  console.log('\n✨ All migrations completed!\n');
}

main().catch(console.error);
