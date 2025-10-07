require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixIsActive() {
  console.log('🔧 Fixing is_active column in business_users\n');

  // Get all business_users records
  const { data: businessUsers, error: fetchError } = await supabase
    .from('business_users')
    .select('*');

  if (fetchError) {
    console.log('❌ Error fetching records:', fetchError.message);
    return;
  }

  console.log(`📊 Found ${businessUsers.length} business_users records\n`);

  // Check current state
  const activeCount = businessUsers.filter(bu => bu.is_active === true).length;
  const inactiveCount = businessUsers.filter(bu => bu.is_active === false || bu.is_active === null).length;

  console.log(`   ✅ Currently active: ${activeCount}`);
  console.log(`   ❌ Currently inactive/null: ${inactiveCount}\n`);

  if (inactiveCount > 0) {
    console.log('🔄 Updating inactive/null records to is_active = true...\n');

    const {error: updateError } = await supabase
      .from('business_users')
      .update({ is_active: true })
      .or('is_active.is.null,is_active.eq.false');

    if (updateError) {
      console.log('❌ Update error:', updateError.message);
    } else {
      console.log(`✅ Updated ${inactiveCount} records to is_active = true\n`);
    }

    // Verify
    const { data: verifyData } = await supabase
      .from('business_users')
      .select('*');

    const verifyActive = verifyData.filter(bu => bu.is_active === true).length;
    console.log(`\n✅ Verification: ${verifyActive}/${verifyData.length} records now active\n`);
  } else {
    console.log('✅ All records already active!\n');
  }
}

fixIsActive();
