require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAMSSpa() {
  console.log('🏢 Creating AMS Spa Services...\n');

  // Step 1: Create business
  console.log('1. Creating business record...');
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .insert({
      name: 'AMS Spa Services',
      slug: 'ams-spa-services',
      business_type: 'beauty_salon',
      email: 'admin@amsspa.com',
      phone: '(555) 123-4567',
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

  if (bizError) {
    console.log('❌ Business creation failed:', bizError.message);
    return;
  }

  console.log('✅ Business created:', business.id);

  // Step 2: Create auth user
  console.log('\n2. Creating user account...');
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: 'admin@amsspa.com',
    password: 'AMSSpa2024!',
    email_confirm: true,
    user_metadata: {
      business_id: business.id,
      business_name: 'AMS Spa Services'
    }
  });

  if (authError) {
    console.log('❌ User creation failed:', authError.message);
    return;
  }

  console.log('✅ User created:', authUser.user.id);

  // Step 3: Link user to business
  console.log('\n3. Linking user to business...');
  const { error: linkError } = await supabase
    .from('business_users')
    .insert({
      business_id: business.id,
      user_id: authUser.user.id,
      role: 'owner'
    });

  if (linkError) {
    console.log('❌ Link error:', linkError.message);
  } else {
    console.log('✅ User linked to business');
  }

  // Step 4: Create sample spa services
  console.log('\n4. Creating sample spa services...');
  const services = [
    { name: 'Swedish Massage', duration: 60, price: 120, description: 'Relaxing full body massage' },
    { name: 'Deep Tissue Massage', duration: 90, price: 150, description: 'Therapeutic deep muscle massage' },
    { name: 'Hot Stone Massage', duration: 75, price: 135, description: 'Heated stones for deep relaxation' },
    { name: 'Facial Treatment', duration: 60, price: 100, description: 'Rejuvenating facial with custom products' },
    { name: 'Body Scrub', duration: 45, price: 80, description: 'Exfoliating body treatment' },
    { name: 'Aromatherapy Session', duration: 60, price: 110, description: 'Essential oils and massage therapy' }
  ];

  for (const service of services) {
    const { error: svcError } = await supabase
      .from('services')
      .insert({
        business_id: business.id,
        name: service.name,
        duration_minutes: service.duration,
        price: service.price,
        description: service.description,
        is_active: true
      });

    if (svcError) {
      console.log(`   ⚠️  Failed to create ${service.name}:`, svcError.message);
    } else {
      console.log(`   ✅ Created: ${service.name} ($${service.price}, ${service.duration} min)`);
    }
  }

  // Step 5: Create sample customers
  console.log('\n5. Creating sample customers...');
  const customers = [
    { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.j@email.com', phone: '(555) 111-2222' },
    { firstName: 'Michael', lastName: 'Chen', email: 'michael.c@email.com', phone: '(555) 333-4444' },
    { firstName: 'Emily', lastName: 'Rodriguez', email: 'emily.r@email.com', phone: '(555) 555-6666' }
  ];

  for (const customer of customers) {
    // Create customer
    const { data: cust, error: custError } = await supabase
      .from('customers')
      .insert({
        first_name: customer.firstName,
        last_name: customer.lastName,
        email: customer.email,
        phone: customer.phone
      })
      .select()
      .single();

    if (!custError && cust) {
      // Link to business
      await supabase
        .from('business_customers')
        .insert({
          business_id: business.id,
          customer_id: cust.id
        });

      console.log(`   ✅ Created: ${customer.firstName} ${customer.lastName}`);
    }
  }

  console.log('\n🎉 AMS Spa Services Setup Complete!');
  console.log('\n📋 Login Information:');
  console.log('   Email: admin@amsspa.com');
  console.log('   Password: AMSSpa2024!');
  console.log('   Business ID:', business.id);
  console.log('\n🔗 Login at: http://localhost:3022/login');
  console.log('\n✅ Ready for testing!');
}

createAMSSpa();
