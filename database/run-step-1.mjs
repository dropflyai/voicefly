#!/usr/bin/env node

/**
 * Run Database Migration Step 1: Add Services Columns
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://irvyhhkoiyzartmmvbxw.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY environment variable is required')
  console.log('Set it in your .env.local file or run: export SUPABASE_SERVICE_KEY="your-key-here"')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function runStep1() {
  try {
    console.log('🚀 Step 1: Adding essential columns to services table...')
    
    // Read the SQL file
    const sqlFile = join(__dirname, '01-add-services-columns.sql')
    const sql = readFileSync(sqlFile, 'utf8')
    
    console.log('📋 Executing SQL commands...')
    console.log('   - Adding display_order column')
    console.log('   - Adding service_type column') 
    console.log('   - Adding is_featured column')
    console.log('   - Adding booking configuration columns')
    console.log('   - Adding settings JSONB column')
    console.log('   - Creating performance indexes')
    console.log('   - Updating existing services display order')
    
    // For now, let's execute this manually since Supabase RPC might not be available
    console.log('')
    console.log('📋 MANUAL EXECUTION REQUIRED:')
    console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard/projects')
    console.log('2. Select your project')
    console.log('3. Go to SQL Editor')
    console.log('4. Copy and paste the following SQL:')
    console.log('')
    console.log('━'.repeat(80))
    console.log(sql)
    console.log('━'.repeat(80))
    console.log('')
    console.log('5. Click "Run" to execute')
    console.log('')
    console.log('✅ After running, proceed to: node database/run-step-2.mjs')
    
  } catch (error) {
    console.error('❌ Step 1 failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runStep1()
}