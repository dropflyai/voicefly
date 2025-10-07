require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🚀 Testing Full Signup Flow...\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFullSignup() {
  const testEmail = 'demo' + Date.now() + '@gmail.com';
  const testPassword = 'Demo123456!';

  try {
    console.log('1️⃣ Creating auth user...');

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Demo',
          last_name: 'User'
        }
      }
    });

    if (authError) {
      console.error('❌ Auth Error:', authError.message);

      // Check if it's an email validation issue
      if (authError.message.includes('invalid')) {
        console.log('\n💡 Try with a standard email format (e.g., user@gmail.com)');
      }
      return;
    }

    console.log('✅ Auth user created:', authData.user.id);
    const userId = authData.user.id;

    // Step 2: Create business
    console.log('\n2️⃣ Creating business record...');
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert({
        name: 'Demo Business Inc',
        email: testEmail,
        business_type: 'general_business',
        subscription_tier: 'professional'
      })
      .select()
      .single();

    if (businessError) {
      console.error('❌ Business Creation Error:', businessError.message);
      console.error('   Details:', businessError);
      return;
    }

    console.log('✅ Business created:', business.id);

    // Step 3: Create business_user association
    console.log('\n3️⃣ Linking user to business...');
    const { error: linkError } = await supabase
      .from('business_users')
      .insert({
        user_id: userId,
        business_id: business.id,
        role: 'owner',
        first_name: 'Demo',
        last_name: 'User'
      });

    if (linkError) {
      console.error('❌ Link Error:', linkError.message);
      console.error('   Details:', linkError);
      return;
    }

    console.log('✅ User linked to business');

    // Verify everything
    console.log('\n4️⃣ Verifying account...');
    const { data: verification } = await supabase
      .from('business_users')
      .select(`
        user_id,
        role,
        businesses:business_id (
          id,
          name,
          business_type
        )
      `)
      .eq('user_id', userId)
      .single();

    console.log('\n✅ SIGNUP COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', testEmail);
    console.log('🔑 Password:', testPassword);
    console.log('👤 User ID:', userId);
    console.log('🏢 Business ID:', business.id);
    console.log('🏷️  Business Name:', business.name);
    console.log('👔 Role:', verification.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎉 You can now login at http://localhost:3002/login');

  } catch (err) {
    console.error('\n❌ Unexpected error:', err.message);
    console.error(err);
  }
}

testFullSignup();
