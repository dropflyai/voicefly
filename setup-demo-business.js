require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupDemo() {
  console.log('🚀 Setting up demo business for client...\n');

  // Check if demo business already exists
  const { data: existing } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', 'demo-business')
    .single();

  if (existing) {
    console.log('✅ Demo business already exists!');
    console.log(`   Name: ${existing.name}`);
    console.log(`   ID: ${existing.id}`);
    console.log(`   Slug: ${existing.slug}`);
    console.log(`\n🔗 Access dashboard at: http://localhost:3022/dashboard?business_id=${existing.id}`);
    return;
  }

  // Create demo business
  const { data: business, error } = await supabase
    .from('businesses')
    .insert({
      name: 'Demo Business',
      slug: 'demo-business',
      business_type: 'professional_services',
      email: 'demo@voicefly.ai',
      phone: '+1-555-0100',
      city: 'Los Angeles',
      state: 'CA',
      country: 'US',
      timezone: 'America/Los_Angeles',
      subscription_tier: 'professional',
      subscription_status: 'active',
      onboarding_completed: true
    })
    .select()
    .single();

  if (error) {
    console.log('❌ Error creating business:', error.message);
    return;
  }

  console.log('✅ Demo business created!');
  console.log(`   Name: ${business.name}`);
  console.log(`   ID: ${business.id}`);
  console.log(`   Slug: ${business.slug}`);

  // Add sample service
  const { data: service } = await supabase
    .from('services')
    .insert({
      business_id: business.id,
      name: 'Consultation',
      description: '30-minute consultation',
      duration_minutes: 30,
      price: 99.00,
      is_active: true
    })
    .select()
    .single();

  if (service) {
    console.log(`\n✅ Sample service created: ${service.name} ($${service.price})`);
  }

  console.log(`\n🔗 Access dashboard at: http://localhost:3022/dashboard?business_id=${business.id}`);
  console.log(`\n✅ VoiceFly is ready for your client!`);
}

setupDemo();
