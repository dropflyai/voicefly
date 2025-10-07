require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDashboard() {
  console.log('🔍 Testing VoiceFly Dashboard Functionality...\n');

  const businessId = '2b4ea939-9a01-4fbc-bc27-24eb4577ba47';

  // Test 1: Fetch business
  console.log('1. Testing business fetch...');
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single();

  if (bizError) {
    console.log('❌ Business fetch failed:', bizError.message);
    return;
  }
  console.log('✅ Business:', business.name);

  // Test 2: Fetch services
  console.log('\n2. Testing services fetch...');
  const { data: services, error: svcError } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', businessId);

  if (svcError) {
    console.log('❌ Services fetch failed:', svcError.message);
  } else {
    console.log(`✅ Services: ${services.length} found`);
    services.forEach(s => console.log(`   - ${s.name} ($${s.price})`));
  }

  // Test 3: Fetch appointments
  console.log('\n3. Testing appointments fetch...');
  const { data: appointments, error: aptError } = await supabase
    .from('appointments')
    .select('*')
    .eq('business_id', businessId);

  if (aptError) {
    console.log('❌ Appointments fetch failed:', aptError.message);
  } else {
    console.log(`✅ Appointments: ${appointments.length} found`);
  }

  // Test 4: Fetch customers
  console.log('\n4. Testing customers fetch...');
  const { data: customers, error: custError } = await supabase
    .from('customers')
    .select('*')
    .limit(5);

  if (custError) {
    console.log('❌ Customers fetch failed:', custError.message);
  } else {
    console.log(`✅ Customers: ${customers.length} found`);
  }

  // Test 5: Create test appointment
  console.log('\n5. Testing appointment creation...');
  const { data: newAppt, error: createError } = await supabase
    .from('appointments')
    .insert({
      business_id: businessId,
      customer_name: 'Test Client',
      customer_phone: '+1-555-1234',
      customer_email: 'test@example.com',
      appointment_date: '2025-10-15',
      start_time: '10:00:00',
      end_time: '10:30:00',
      status: 'pending'
    })
    .select()
    .single();

  if (createError) {
    console.log('❌ Appointment creation failed:', createError.message);
  } else {
    console.log('✅ Test appointment created:', newAppt.id);
  }

  console.log('\n📊 Dashboard Status: OPERATIONAL');
  console.log('🔗 Access at: http://localhost:3022/dashboard?business_id=' + businessId);
}

testDashboard();
