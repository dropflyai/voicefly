import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🚀 Testing AuthService Signup Flow...\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to generate slug
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function testSignup() {
  const timestamp = Date.now();
  const testData = {
    email: `test${timestamp}@gmail.com`,
    password: 'Test123456!',
    firstName: 'Test',
    lastName: 'User',
    companyName: `Test Company ${timestamp}`,
    businessType: 'general_business'
  };

  console.log('📝 Signup Data:');
  console.log('   Email:', testData.email);
  console.log('   Company:', testData.companyName);
  console.log('   Type:', testData.businessType);
  console.log('');

  try {
    // Step 1: Create auth user
    console.log('1️⃣ Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testData.email,
      password: testData.password,
      options: {
        data: {
          first_name: testData.firstName,
          last_name: testData.lastName
        }
      }
    });

    if (authError || !authData.user) {
      console.error('❌ Auth failed:', authError?.message);
      return;
    }

    console.log('✅ Auth user created:', authData.user.id);
    const userId = authData.user.id;

    // Step 2: Create business with proper slug
    console.log('\n2️⃣ Creating business...');
    const slug = generateSlug(testData.companyName);
    console.log('   Generated slug:', slug);

    const businessData = {
      name: testData.companyName,
      slug,
      business_type: testData.businessType,
      email: testData.email,
      phone: '',
      subscription_tier: 'professional',
      subscription_status: 'trial',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      timezone: 'America/Los_Angeles'
    };

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert(businessData)
      .select()
      .single();

    if (businessError) {
      console.error('❌ Business creation failed:', businessError.message);
      console.error('   Details:', businessError.details);
      return;
    }

    console.log('✅ Business created:', business.id);

    // Step 3: Link user to business
    console.log('\n3️⃣ Linking user to business...');
    const { error: linkError } = await supabase
      .from('business_users')
      .insert({
        user_id: userId,
        business_id: business.id,
        role: 'owner',
        first_name: testData.firstName,
        last_name: testData.lastName,
        phone: ''
      });

    if (linkError) {
      console.error('❌ Link failed:', linkError.message);
      return;
    }

    console.log('✅ User linked to business');

    // Verify
    console.log('\n4️⃣ Verifying account...');
    const { data: verification } = await supabase
      .from('business_users')
      .select(`
        role,
        businesses:business_id (
          id,
          name,
          slug,
          business_type
        )
      `)
      .eq('user_id', userId)
      .single();

    console.log('\n✅ SIGNUP SUCCESSFUL!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', testData.email);
    console.log('🔑 Password:', testData.password);
    console.log('👤 User ID:', userId);
    console.log('🏢 Business ID:', business.id);
    console.log('🏷️  Business Name:', business.name);
    console.log('🔗 Slug:', business.slug);
    console.log('👔 Role:', verification.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎉 Account ready! Login at: http://localhost:3002/login');
    console.log('📊 Dashboard URL: http://localhost:3002/dashboard');

  } catch (err) {
    console.error('\n❌ Error:', err.message);
  }
}

testSignup();
