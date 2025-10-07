require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  console.log('🔍 Checking database tables...\n');

  const { data, error } = await supabase
    .from('businesses')
    .select('id, business_name')
    .limit(5);

  if (error) {
    console.log('❌ Error:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('\n⚠️  DATABASE SCHEMA NOT DEPLOYED');
      console.log('\n📋 You need to:');
      console.log('1. Open: https://supabase.com/dashboard/project/irvyhhkoiyzartmmvbxw/sql/new');
      console.log('2. Copy/paste: CONSOLIDATED-DATABASE-SCHEMA.sql');
      console.log('3. Click "Run"');
    }
  } else {
    console.log('✅ Database tables exist!');
    console.log(`   Found ${data.length} businesses`);
    if (data.length > 0) {
      console.log('\n   Businesses:');
      data.forEach(b => console.log(`   - ${b.business_name} (${b.id})`));
    }
  }
}

checkTables();
