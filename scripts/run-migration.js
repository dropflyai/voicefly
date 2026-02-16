#!/usr/bin/env node
// Run Phone Employees Migration using Supabase REST API

const fs = require('fs')
const path = require('path')

const SUPABASE_URL = 'https://kqsquisdqjedzenwhrkl.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtxc3F1aXNkcWplZHplbndocmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA0NTY2MywiZXhwIjoyMDczNjIxNjYzfQ.ar3eADbhXs-KU5nGJ-88KQFIUTWf-0PfShEVn9iUImM'

async function runMigration() {
  console.log('🔧 Running Phone Employees Migration...\n')

  // Read migration file
  const migrationPath = path.join(__dirname, '../database/phone-employees-migration.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  // Execute via Supabase REST API
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ query: sql })
  })

  if (response.ok) {
    console.log('✅ Migration completed successfully!')
    const result = await response.json()
    console.log('\nResult:', result)
  } else {
    const error = await response.text()
    console.error('❌ Migration failed:', error)

    // Try alternative method: Execute statements one by one
    console.log('\n🔄 Trying alternative method: executing statements individually...\n')
    await executeStatementsIndividually(sql)
  }
}

async function executeStatementsIndividually(sql) {
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`Found ${statements.length} SQL statements to execute\n`)

  let succeeded = 0
  let failed = 0

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    const preview = stmt.substring(0, 80).replace(/\n/g, ' ')

    try {
      // Execute via raw SQL query
      const { error } = await supabase.rpc('exec_sql', { sql_query: stmt + ';' })

      if (error) {
        console.log(`❌ [${i + 1}/${statements.length}] FAILED: ${preview}...`)
        console.log(`   Error: ${error.message}\n`)
        failed++
      } else {
        console.log(`✅ [${i + 1}/${statements.length}] ${preview}...`)
        succeeded++
      }
    } catch (err) {
      console.log(`❌ [${i + 1}/${statements.length}] ERROR: ${preview}...`)
      console.log(`   ${err.message}\n`)
      failed++
    }
  }

  console.log(`\n📊 Migration Complete: ${succeeded} succeeded, ${failed} failed`)
}

runMigration().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
