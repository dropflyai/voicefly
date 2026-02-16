// Create a test account for VoiceFly
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://kqsquisdqjedzenwhrkl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtxc3F1aXNkcWplZHplbndocmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA0NTY2MywiZXhwIjoyMDczNjIxNjYzfQ.ar3eADbhXs-KU5nGJ-88KQFIUTWf-0PfShEVn9iUImM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestAccount() {
  console.log('🔧 Creating test account...')

  const testEmail = 'test@voicefly.ai'
  const testPassword = 'Test1234!'

  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        first_name: 'Test',
        last_name: 'User'
      }
    })

    if (authError) throw authError

    const userId = authData.user.id
    console.log('✅ Auth user created:', userId)

    // Create business using secure function
    const { data: businessResult, error: businessError } = await supabase.rpc('create_business_for_new_user', {
      p_business_name: 'Test Restaurant',
      p_email: testEmail,
      p_phone: '+15555551234',
      p_business_type: 'restaurant',
      p_user_id: userId,
      p_first_name: 'Test',
      p_last_name: 'User'
    })

    if (businessError) throw businessError

    console.log('✅ Business created:', businessResult.id)
    console.log('\n🎉 Test account created successfully!')
    console.log('\n📋 Login credentials:')
    console.log('   Email:', testEmail)
    console.log('   Password:', testPassword)
    console.log('\n🌐 Login at: http://localhost:3003/login')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

createTestAccount()
