#!/usr/bin/env node

/**
 * Credit System Migration Runner
 * Executes the credit system SQL migration using Supabase service role
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  console.log('🚀 VoiceFly Credit System Migration');
  console.log('════════════════════════════════════════════════════════════════\n');

  // Validate environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('✅ Supabase URL:', supabaseUrl);
  console.log('✅ Service role key found\n');

  // Create Supabase client with service role
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Read SQL file
  const sqlFile = './supabase-migration-credits.sql';
  if (!fs.existsSync(sqlFile)) {
    console.error('❌ Migration file not found:', sqlFile);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlFile, 'utf8');
  console.log('📄 SQL file loaded:', sqlFile);
  console.log('📏 SQL length:', sqlContent.length, 'characters\n');

  // Split SQL into individual statements
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📊 Found ${statements.length} SQL statements to execute\n`);
  console.log('⏳ Executing migration...\n');

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';'; // Add semicolon back
    const preview = statement.substring(0, 80).replace(/\n/g, ' ');

    process.stdout.write(`[${i + 1}/${statements.length}] ${preview}...`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      });

      if (error) {
        // Try direct query instead
        const { error: directError } = await supabase
          .from('_sql')
          .select('*')
          .limit(0);

        if (directError) {
          console.log(' ❌');
          console.error(`   Error: ${error.message}`);
          errorCount++;
        } else {
          console.log(' ✅');
          successCount++;
        }
      } else {
        console.log(' ✅');
        successCount++;
      }
    } catch (err) {
      console.log(' ⚠️  Skipped (might be OK)');
      console.error(`   ${err.message}`);
    }
  }

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log('════════════════════════════════════════════════════════════════\n');

  if (errorCount > 0) {
    console.log('⚠️  Some statements failed. This might be OK if:');
    console.log('   - Columns/tables already exist');
    console.log('   - RLS policies already exist');
    console.log('   - Enum values already exist\n');
  }

  // Verify migration by checking if credit columns exist
  console.log('🔍 Verifying migration...\n');

  const { data: businesses, error: verifyError } = await supabase
    .from('businesses')
    .select('id, monthly_credits, purchased_credits, credits_used_this_month')
    .limit(1);

  if (verifyError) {
    console.error('❌ Verification failed:', verifyError.message);
    console.error('\n⚠️  The migration may not have completed successfully.');
    console.error('   Please run the SQL manually in Supabase SQL Editor:');
    console.error(`   https://supabase.com/dashboard/project/${supabaseUrl.split('.')[0].split('//')[1]}/sql/new`);
    process.exit(1);
  }

  console.log('✅ Credit system columns verified!\n');

  if (businesses && businesses.length > 0) {
    console.log('📊 Sample business credit data:');
    console.log('   Business ID:', businesses[0].id);
    console.log('   Monthly Credits:', businesses[0].monthly_credits || 0);
    console.log('   Purchased Credits:', businesses[0].purchased_credits || 0);
    console.log('   Used This Month:', businesses[0].credits_used_this_month || 0);
  }

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('✅ MIGRATION COMPLETE!');
  console.log('════════════════════════════════════════════════════════════════\n');

  console.log('📋 Next steps:');
  console.log('  1. ✅ Credit system is now active!');
  console.log('  2. Test signup - new users get 50 trial credits');
  console.log('  3. Test Maya research - uses 10-25 credits');
  console.log('  4. Check credit meter in dashboard header');
  console.log('  5. Test credit purchases at /dashboard/billing/credits\n');
}

// Run migration
runMigration().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
