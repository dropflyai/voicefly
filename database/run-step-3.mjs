#!/usr/bin/env node

/**
 * Run Database Migration Step 3: Create Service Categories
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function runStep3() {
  try {
    console.log('🚀 Step 3: Creating service categories table and default categories...')
    
    // Read the SQL file
    const sqlFile = join(__dirname, '03-create-service-categories.sql')
    const sql = readFileSync(sqlFile, 'utf8')
    
    console.log('📋 This step will:')
    console.log('   - Create service_categories table')
    console.log('   - Add performance indexes')
    console.log('   - Create updated_at trigger')
    console.log('   - Insert default categories for existing businesses:')
    console.log('     • Manicure Services')
    console.log('     • Pedicure Services') 
    console.log('     • Combo Packages')
    console.log('     • Add-on Services')
    
    console.log('')
    console.log('📋 MANUAL EXECUTION REQUIRED:')
    console.log('1. Go to your Supabase Dashboard SQL Editor')
    console.log('2. Copy and paste the following SQL:')
    console.log('')
    console.log('━'.repeat(80))
    console.log(sql)
    console.log('━'.repeat(80))
    console.log('')
    console.log('3. Click "Run" to execute')
    console.log('')
    console.log('✅ After running, proceed to: node database/run-step-4.mjs')
    
  } catch (error) {
    console.error('❌ Step 3 failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runStep3()
}