require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupAuth() {
  console.log('🔐 Setting up VoiceFly Authentication...\n');

  const businessId = '2b4ea939-9a01-4fbc-bc27-24eb4577ba47';
  const testEmail = 'demo@voicefly.ai';
  const testPassword = 'VoiceFly2024!';

  // Step 1: Create auth user
  console.log('1. Creating test user...');
  const { data: authUser, error: signupError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: {
      business_id: businessId,
      business_name: 'Demo Business'
    }
  });

  if (signupError) {
    if (signupError.message.includes('already registered')) {
      console.log('✅ User already exists');

      // Get existing user
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users.users.find(u => u.email === testEmail);

      if (existingUser) {
        console.log(`   User ID: ${existingUser.id}`);

        // Step 2: Link to business
        console.log('\n2. Linking user to business...');
        const { error: linkError } = await supabase
          .from('business_users')
          .upsert({
            business_id: businessId,
            user_id: existingUser.id,
            role: 'owner'
          }, {
            onConflict: 'business_id,user_id'
          });

        if (linkError) {
          console.log('⚠️  Link error:', linkError.message);
        } else {
          console.log('✅ User linked to business');
        }
      }
    } else {
      console.log('❌ Signup error:', signupError.message);
      return;
    }
  } else {
    console.log('✅ User created:', authUser.user.id);

    // Step 2: Link to business
    console.log('\n2. Linking user to business...');
    const { error: linkError } = await supabase
      .from('business_users')
      .insert({
        business_id: businessId,
        user_id: authUser.user.id,
        role: 'owner'
      });

    if (linkError) {
      console.log('❌ Link error:', linkError.message);
    } else {
      console.log('✅ User linked to business');
    }
  }

  console.log('\n📋 Login Credentials:');
  console.log('   Email:', testEmail);
  console.log('   Password:', testPassword);
  console.log('\n🔗 Login at: http://localhost:3022/login');
  console.log('\n✅ Auth setup complete!');
}

setupAuth();
