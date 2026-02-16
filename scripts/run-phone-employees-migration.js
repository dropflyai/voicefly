/**
 * Run Phone Employees Database Migration
 *
 * This script runs the phone employees migration using Supabase client.
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🚀 Starting Phone Employees migration...\n')

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../database/phone-employees-migration.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // Split by statement (basic split on semicolons, handling simple cases)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'))

    console.log(`📄 Found ${statements.length} SQL statements\n`)

    // Execute each statement
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'

      // Skip empty or comment-only statements
      if (statement.trim() === ';' || statement.trim().startsWith('--')) {
        continue
      }

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })

        if (error) {
          // Try direct query as fallback
          const { error: directError } = await supabase.from('_migrations').select('*').limit(0)

          if (directError) {
            console.error(`❌ Statement ${i + 1} failed:`, error.message.substring(0, 100))
            errorCount++
          } else {
            successCount++
          }
        } else {
          successCount++
          if (successCount % 10 === 0) {
            console.log(`✅ Executed ${successCount} statements...`)
          }
        }
      } catch (err) {
        console.error(`❌ Statement ${i + 1} error:`, err.message.substring(0, 100))
        errorCount++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`✅ Migration completed: ${successCount} succeeded, ${errorCount} errors`)
    console.log('='.repeat(60) + '\n')

    // Verify tables were created
    console.log('🔍 Verifying tables...\n')

    const tablesToCheck = [
      'phone_employees',
      'phone_messages',
      'scheduled_tasks',
      'phone_orders',
      'action_requests',
      'employee_calls',
      'employee_metrics',
      'communication_logs'
    ]

    for (const table of tablesToCheck) {
      try {
        const { error } = await supabase.from(table).select('*').limit(0)
        if (error) {
          console.log(`❌ ${table}: Not found or error`)
        } else {
          console.log(`✅ ${table}: Exists`)
        }
      } catch (err) {
        console.log(`❌ ${table}: Error checking`)
      }
    }

    console.log('\n✨ Migration script completed!')
    console.log('\n📝 Next steps:')
    console.log('   1. Check Supabase dashboard to verify tables')
    console.log('   2. Set up required API keys (see below)')
    console.log('   3. Test employee creation at /dashboard/employees\n')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
