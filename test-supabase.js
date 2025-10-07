require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  try {
    // Test 1: Check if we can connect
    const { data, error } = await supabase
      .from('businesses')
      .select('count')
      .limit(1);

    if (error) {
      console.error('\n❌ Supabase Connection Error:', error.message);
      console.error('   Code:', error.code);
      console.error('   Details:', error.details);

      if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
        console.error('\n💡 Fix: Check your Supabase keys at:');
        console.error('   https://supabase.com/dashboard/project/irvyhhkoiyzartmmvbxw/settings/api');
      }
    } else {
      console.log('\n✅ Supabase connection successful!');
      console.log('   Database is accessible');
    }

    // Test 2: Check auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'test123456'
    });

    if (authError) {
      console.error('\n❌ Supabase Auth Error:', authError.message);

      if (authError.message.includes('Email signups are disabled')) {
        console.error('\n💡 Fix: Enable Email Auth at:');
        console.error('   https://supabase.com/dashboard/project/irvyhhkoiyzartmmvbxw/auth/providers');
      }
    } else {
      console.log('\n✅ Supabase Auth is working!');
      console.log('   Email signup is enabled');
    }

  } catch (err) {
    console.error('\n❌ Unexpected Error:', err.message);
  }
}

test();
