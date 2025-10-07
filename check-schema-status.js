require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('🔍 Checking database schema status...\n');

  const requiredTables = [
    'businesses',
    'business_users',
    'customers',
    'business_customers',
    'appointments',
    'services',
    'staff',
    'payments',
    'voice_ai_calls',
    'daily_metrics'
  ];

  const results = {
    existing: [],
    missing: []
  };

  for (const table of requiredTables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      if (error.message.includes('does not exist')) {
        results.missing.push(table);
      } else {
        // Table exists but might have schema issues
        results.existing.push(`${table} (⚠️  ${error.message.substring(0, 50)}...)`);
      }
    } else {
      results.existing.push(table);
    }
  }

  console.log('✅ Existing tables:');
  results.existing.forEach(t => console.log(`   - ${t}`));

  if (results.missing.length > 0) {
    console.log('\n❌ Missing tables:');
    results.missing.forEach(t => console.log(`   - ${t}`));
  }

  console.log(`\n📊 Status: ${results.existing.length}/${requiredTables.length} tables ready`);

  if (results.missing.length > 0) {
    console.log('\n⚠️  Partial schema detected. Need to complete setup.');
  } else {
    console.log('\n✅ All core tables exist! Database is ready.');
  }
}

checkSchema();
