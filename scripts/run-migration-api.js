#!/usr/bin/env node
// Run migration via Supabase Management API
const fs = require('fs')
const path = require('path')

const PROJECT_REF = 'kqsquisdqjedzenwhrkl'
const ACCESS_TOKEN = 'sbp_94c035b009fa25934eb2c93683048fd9e4eb4ebc'

async function runQuery(sql, label) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  })

  const text = await res.text()
  if (!res.ok) {
    console.log(`  ❌ ${label}: ${text}`)
    return false
  }
  console.log(`  ✅ ${label}`)
  return true
}

async function main() {
  console.log('🔧 Running Phone Employees Migration via Supabase Management API\n')

  const migrationSQL = fs.readFileSync(
    path.join(__dirname, '../database/phone-employees-migration.sql'),
    'utf8'
  )

  // Split into logical blocks (separated by the section headers)
  const blocks = []
  let current = ''
  let currentLabel = 'Setup'

  for (const line of migrationSQL.split('\n')) {
    if (line.startsWith('-- ===') && current.trim()) {
      blocks.push({ sql: current.trim(), label: currentLabel })
      current = ''
    } else if (line.startsWith('-- ') && line.includes('TABLE') && !line.startsWith('-- -')) {
      currentLabel = line.replace(/^--\s*/, '').trim()
    }
    current += line + '\n'
  }
  if (current.trim()) {
    blocks.push({ sql: current.trim(), label: currentLabel })
  }

  // Execute each block
  let succeeded = 0
  let failed = 0

  for (const block of blocks) {
    const ok = await runQuery(block.sql, block.label)
    if (ok) succeeded++
    else failed++
  }

  console.log(`\n📊 Results: ${succeeded} succeeded, ${failed} failed`)

  // Verify tables exist
  console.log('\n🔍 Verifying tables...')
  const tables = ['phone_employees', 'phone_messages', 'scheduled_tasks', 'phone_orders', 'action_requests', 'employee_calls', 'employee_metrics', 'communication_logs']

  for (const table of tables) {
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: `SELECT COUNT(*) as count FROM ${table}` })
    })
    if (res.ok) {
      console.log(`  ✅ ${table} exists`)
    } else {
      console.log(`  ❌ ${table} NOT FOUND`)
    }
  }

  console.log('\n🎉 Migration complete!')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
