// Check Supabase project and list all tables
import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseTables() {
  console.log('🔍 Checking Supabase Database...\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // Extract project ref from URL
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  console.log('📋 Supabase Project Info:')
  console.log(`   URL: ${supabaseUrl}`)
  console.log(`   Reference ID: ${projectRef}`)
  console.log('')

  // Check if we can connect
  try {
    const { data: testData, error: testError } = await supabase
      .from('businesses')
      .select('count')
      .limit(1)

    if (testError && testError.message.includes('relation "businesses" does not exist')) {
      console.log('⚠️  CRITICAL: businesses table does not exist!')
      console.log('   This is a fresh database that needs all tables created.\n')
    } else if (testError) {
      console.log('⚠️  Connection issue:', testError.message, '\n')
    } else {
      console.log('✅ Successfully connected to database\n')
    }
  } catch (err: any) {
    console.log('❌ Connection failed:', err.message, '\n')
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('📊 Checking Tables...\n')

  // List of tables we expect based on migrations
  const expectedTables = [
    'businesses',
    'business_users',
    'services',
    'customers',
    'staff',
    'appointments',
    'phone_numbers',
    'call_logs',
    'sms_messages',
    'audit_logs',
    'activity_logs',
    'credits',
    'credit_transactions',
    'bookings',
    'booking_slots'
  ]

  // Check each table
  for (const tableName of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('count')
        .limit(1)

      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`❌ ${tableName.padEnd(25)} - MISSING`)
        } else {
          console.log(`⚠️  ${tableName.padEnd(25)} - ERROR: ${error.message}`)
        }
      } else {
        console.log(`✅ ${tableName.padEnd(25)} - EXISTS`)
      }
    } catch (err: any) {
      console.log(`❌ ${tableName.padEnd(25)} - ERROR: ${err.message}`)
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // Check for the function we just added
  console.log('🔍 Checking Database Functions...\n')

  try {
    const { data, error } = await supabase.rpc('create_business_for_new_user', {
      p_business_name: 'Test Business',
      p_email: 'test@test.com',
      p_phone: '',
      p_business_type: 'test',
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_first_name: 'Test',
      p_last_name: 'User'
    })

    if (error && error.message.includes('function') && error.message.includes('does not exist')) {
      console.log('❌ create_business_for_new_user - MISSING (signup will fail!)')
    } else if (error) {
      // We expect an error because we're using a fake UUID, but the function exists
      console.log('✅ create_business_for_new_user - EXISTS')
    } else {
      console.log('✅ create_business_for_new_user - EXISTS')
    }
  } catch (err: any) {
    console.log('❌ create_business_for_new_user - ERROR:', err.message)
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('📝 Summary:\n')
  console.log('If any tables show ❌ MISSING, they need to be created.')
  console.log('See migration files in: supabase/migrations/\n')
}

checkDatabaseTables()
  .then(() => {
    console.log('✅ Check complete!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('❌ Error:', err)
    process.exit(1)
  })
