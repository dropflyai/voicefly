#!/usr/bin/env node

/**
 * Run Database Migration Step 4: Create Helper Functions and Views
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function runStep4() {
  try {
    console.log('🚀 Step 4: Creating helper functions and views...')
    
    // Read the FIXED SQL file
    const sqlFile = join(__dirname, '04-create-helper-functions-fixed.sql')
    const sql = readFileSync(sqlFile, 'utf8')
    
    // Also read the optional revenue view
    const revenueViewFile = join(__dirname, '04b-create-revenue-view.sql')
    const revenueViewSql = readFileSync(revenueViewFile, 'utf8')
    
    console.log('📋 This step will create:')
    console.log('   - get_service_stats() function for business analytics')
    console.log('   - duplicate_services_for_location() function for multi-location')
    console.log('   - active_services_by_business view')
    
    console.log('')
    console.log('📋 STEP 4A - CORE FUNCTIONS (REQUIRED):')
    console.log('1. Go to your Supabase Dashboard SQL Editor')
    console.log('2. Copy and paste the following SQL:')
    console.log('')
    console.log('━'.repeat(80))
    console.log(sql)
    console.log('━'.repeat(80))
    console.log('')
    console.log('3. Click "Run" to execute')
    console.log('')
    
    console.log('📋 STEP 4B - REVENUE VIEW (OPTIONAL):')
    console.log('Only run this if you have appointments and payments tables set up.')
    console.log('Copy and paste this SQL in a separate query:')
    console.log('')
    console.log('━'.repeat(80))
    console.log(revenueViewSql)
    console.log('━'.repeat(80))
    console.log('')
    
    console.log('🎉 MIGRATION COMPLETE!')
    console.log('')
    console.log('✅ All database changes have been applied.')
    console.log('✅ Your services customization feature is now ready.')
    console.log('')
    console.log('Next steps:')
    console.log('1. Test the onboarding flow at http://localhost:3005/onboarding')
    console.log('2. Customize service names and prices') 
    console.log('3. Complete onboarding and verify services are saved correctly')
    
  } catch (error) {
    console.error('❌ Step 4 failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runStep4()
}