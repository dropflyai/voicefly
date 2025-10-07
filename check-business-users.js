require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBusinessUsers() {
  console.log('🔍 Checking business_users table structure\n');

  const { data, error } = await supabase
    .from('business_users')
    .select('*')
    .limit(5);

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log(`📊 Found ${data.length} records (showing first 5)\n`);
    console.log('Columns:', Object.keys(data[0]).join(', '), '\n');

    data.forEach((row, i) => {
      console.log(`Record ${i + 1}:`);
      Object.keys(row).forEach(key => {
        console.log(`   ${key}: ${row[key]} (${typeof row[key]})`);
      });
      console.log();
    });
  } else {
    console.log('No records found');
  }

  // Try querying WITH is_active filter to see what happens
  console.log('\n🔍 Testing query WITH is_active = true filter:');
  const { data: activeData, error: activeError } = await supabase
    .from('business_users')
    .select('*')
    .eq('is_active', true);

  if (activeError) {
    console.log('   ❌ Error:', activeError.message);
  } else {
    console.log(`   ✅ Found ${activeData?.length || 0} active records`);
  }

  // Try querying WITHOUT is_active filter
  console.log('\n🔍 Testing query WITHOUT is_active filter:');
  const { data: allData, error: allError } = await supabase
    .from('business_users')
    .select('*');

  if (allError) {
    console.log('   ❌ Error:', allError.message);
  } else {
    console.log(`   ✅ Found ${allData?.length || 0} total records`);
  }
}

checkBusinessUsers();
