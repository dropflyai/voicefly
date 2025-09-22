#!/usr/bin/env node

/**
 * Run Database Migration Step 2: Add Business Columns
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function runStep2() {
  try {
    console.log('🚀 Step 2: Adding essential columns to businesses table...')
    
    // Read the SQL file
    const sqlFile = join(__dirname, '02-add-business-columns.sql')
    const sql = readFileSync(sqlFile, 'utf8')
    
    console.log('📋 This step will:')
    console.log('   - Add settings JSONB column to businesses')
    console.log('   - Add owner information columns')
    console.log('   - Add vapi_assistant_id column')
    console.log('   - Update subscription_tier enum to include "business"')
    console.log('   - Create performance indexes')
    
    console.log('')
    console.log('📋 MANUAL EXECUTION REQUIRED:')
    console.log('1. Go to your Supabase Dashboard SQL Editor')
    console.log('2. Copy and paste the following SQL:')
    console.log('')
    console.log('━'.repeat(80))
    console.log(sql)
    console.log('━'.repeat(80))
    console.log('')
    console.log('5. Click "Run" to execute')
    console.log('')
    console.log('✅ After running, proceed to: node database/run-step-3.mjs')
    
  } catch (error) {
    console.error('❌ Step 2 failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runStep2()
}