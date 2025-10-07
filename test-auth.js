require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔐 Testing Supabase Auth...\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  try {
    // Test email/password signup
    const { data, error } = await supabase.auth.signUp({
      email: 'test' + Date.now() + '@gmail.com',
      password: 'Test123456!',
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User'
        }
      }
    });

    if (error) {
      console.error('❌ Auth Signup Error:', error.message);
      console.error('   Status:', error.status);
      console.error('   Code:', error.code || 'N/A');

      if (error.message.includes('Email') || error.message.includes('disabled') || error.message.includes('not enabled')) {
        console.log('\n💡 FIX REQUIRED:');
        console.log('   1. Open: https://supabase.com/dashboard/project/irvyhhkoiyzartmmvbxw/auth/providers');
        console.log('   2. Find "Email" in the providers list');
        console.log('   3. Toggle "Enable Email provider" to ON');
        console.log('   4. Click "Save"');
      }
    } else {
      console.log('✅ Auth signup successful!');
      console.log('   User ID:', data.user?.id);
      console.log('   Email:', data.user?.email);
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

testAuth();
