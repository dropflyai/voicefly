require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const industries = {
  medical_practice: {
    name: 'Valley Medical Practice',
    slug: 'valley-medical',
    email: 'admin@valleymedical.com',
    password: 'Medical2024!',
    phone: '(555) 201-3000',
    city: 'Phoenix',
    state: 'AZ',
    services: [
      { name: 'Annual Physical Exam', duration: 30, price: 200, category: 'Checkup' },
      { name: 'Sick Visit', duration: 15, price: 100, category: 'Visit' },
      { name: 'Telehealth Consultation', duration: 20, price: 75, category: 'Virtual' },
      { name: 'Lab Work Review', duration: 15, price: 50, category: 'Follow-up' },
      { name: 'Vaccination', duration: 10, price: 30, category: 'Preventive' },
      { name: 'Wellness Consultation', duration: 30, price: 150, category: 'Wellness' }
    ],
    customers: [
      { firstName: 'John', lastName: 'Smith', email: 'john.s@email.com', phone: '(555) 401-1001' },
      { firstName: 'Lisa', lastName: 'Brown', email: 'lisa.b@email.com', phone: '(555) 401-1002' },
      { firstName: 'Robert', lastName: 'Taylor', email: 'robert.t@email.com', phone: '(555) 401-1003' }
    ]
  },
  dental_practice: {
    name: 'Bright Smile Dentistry',
    slug: 'bright-smile',
    email: 'admin@brightsmile.com',
    password: 'Dental2024!',
    phone: '(555) 202-4000',
    city: 'Austin',
    state: 'TX',
    services: [
      { name: 'Routine Cleaning', duration: 45, price: 120, category: 'Hygiene' },
      { name: 'Dental Exam', duration: 30, price: 85, category: 'Exam' },
      { name: 'Teeth Whitening', duration: 60, price: 350, category: 'Cosmetic' },
      { name: 'Filling', duration: 45, price: 200, category: 'Restorative' },
      { name: 'Crown Placement', duration: 90, price: 1200, category: 'Restorative' },
      { name: 'Emergency Visit', duration: 30, price: 150, category: 'Emergency' }
    ],
    customers: [
      { firstName: 'Amanda', lastName: 'Wilson', email: 'amanda.w@email.com', phone: '(555) 402-2001' },
      { firstName: 'David', lastName: 'Martinez', email: 'david.m@email.com', phone: '(555) 402-2002' },
      { firstName: 'Jennifer', lastName: 'Davis', email: 'jennifer.d@email.com', phone: '(555) 402-2003' }
    ]
  },
  beauty_salon: {
    name: 'Luxe Beauty Studio',
    slug: 'luxe-beauty',
    email: 'admin@luxebeauty.com',
    password: 'Beauty2024!',
    phone: '(555) 203-5000',
    city: 'Miami',
    state: 'FL',
    services: [
      { name: 'Haircut & Style', duration: 60, price: 80, category: 'Hair' },
      { name: 'Color Treatment', duration: 120, price: 180, category: 'Hair' },
      { name: 'Manicure', duration: 45, price: 45, category: 'Nails' },
      { name: 'Pedicure', duration: 60, price: 65, category: 'Nails' },
      { name: 'Facial', duration: 60, price: 95, category: 'Skincare' },
      { name: 'Makeup Application', duration: 45, price: 75, category: 'Makeup' }
    ],
    customers: [
      { firstName: 'Sophia', lastName: 'Garcia', email: 'sophia.g@email.com', phone: '(555) 403-3001' },
      { firstName: 'Olivia', lastName: 'Anderson', email: 'olivia.a@email.com', phone: '(555) 403-3002' },
      { firstName: 'Isabella', lastName: 'Thomas', email: 'isabella.t@email.com', phone: '(555) 403-3003' }
    ]
  },
  fitness_wellness: {
    name: 'Core Fitness Studio',
    slug: 'core-fitness',
    email: 'admin@corefitness.com',
    password: 'Fitness2024!',
    phone: '(555) 204-6000',
    city: 'Denver',
    state: 'CO',
    services: [
      { name: 'Personal Training Session', duration: 60, price: 85, category: 'Training' },
      { name: 'Group Yoga Class', duration: 60, price: 25, category: 'Class' },
      { name: 'HIIT Training', duration: 45, price: 30, category: 'Class' },
      { name: 'Nutrition Consultation', duration: 45, price: 100, category: 'Wellness' },
      { name: 'Body Composition Analysis', duration: 30, price: 50, category: 'Assessment' },
      { name: 'Massage Therapy', duration: 60, price: 110, category: 'Recovery' }
    ],
    customers: [
      { firstName: 'Marcus', lastName: 'Johnson', email: 'marcus.j@email.com', phone: '(555) 404-4001' },
      { firstName: 'Ashley', lastName: 'White', email: 'ashley.w@email.com', phone: '(555) 404-4002' },
      { firstName: 'Tyler', lastName: 'Harris', email: 'tyler.h@email.com', phone: '(555) 404-4003' }
    ]
  },
  home_services: {
    name: 'Premier Home Services',
    slug: 'premier-home',
    email: 'admin@premierhome.com',
    password: 'Home2024!',
    phone: '(555) 205-7000',
    city: 'Seattle',
    state: 'WA',
    services: [
      { name: 'Plumbing Repair', duration: 120, price: 180, category: 'Plumbing' },
      { name: 'Electrical Service', duration: 90, price: 150, category: 'Electrical' },
      { name: 'HVAC Maintenance', duration: 120, price: 200, category: 'HVAC' },
      { name: 'House Cleaning', duration: 180, price: 150, category: 'Cleaning' },
      { name: 'Lawn Care', duration: 60, price: 75, category: 'Landscaping' },
      { name: 'Handyman Service', duration: 120, price: 120, category: 'General' }
    ],
    customers: [
      { firstName: 'Thomas', lastName: 'Clark', email: 'thomas.c@email.com', phone: '(555) 405-5001' },
      { firstName: 'Patricia', lastName: 'Lewis', email: 'patricia.l@email.com', phone: '(555) 405-5002' },
      { firstName: 'Christopher', lastName: 'Walker', email: 'chris.w@email.com', phone: '(555) 405-5003' }
    ]
  },
  medspa: {
    name: 'Radiance MedSpa',
    slug: 'radiance-medspa',
    email: 'admin@radiancemedspa.com',
    password: 'MedSpa2024!',
    phone: '(555) 206-8000',
    city: 'Scottsdale',
    state: 'AZ',
    services: [
      { name: 'Botox Treatment', duration: 30, price: 400, category: 'Injectable' },
      { name: 'Dermal Fillers', duration: 45, price: 600, category: 'Injectable' },
      { name: 'Laser Hair Removal', duration: 30, price: 250, category: 'Laser' },
      { name: 'Chemical Peel', duration: 45, price: 200, category: 'Skincare' },
      { name: 'Microneedling', duration: 60, price: 350, category: 'Skincare' },
      { name: 'IV Hydration Therapy', duration: 45, price: 175, category: 'Wellness' }
    ],
    customers: [
      { firstName: 'Victoria', lastName: 'Hall', email: 'victoria.h@email.com', phone: '(555) 406-6001' },
      { firstName: 'Natalie', lastName: 'Young', email: 'natalie.y@email.com', phone: '(555) 406-6002' },
      { firstName: 'Alexandra', lastName: 'King', email: 'alex.k@email.com', phone: '(555) 406-6003' }
    ]
  },
  law_firm: {
    name: 'Sterling Legal Group',
    slug: 'sterling-legal',
    email: 'admin@sterlinglegal.com',
    password: 'Legal2024!',
    phone: '(555) 207-9000',
    city: 'Boston',
    state: 'MA',
    services: [
      { name: 'Initial Consultation', duration: 60, price: 300, category: 'Consultation' },
      { name: 'Contract Review', duration: 120, price: 500, category: 'Business' },
      { name: 'Estate Planning', duration: 90, price: 450, category: 'Estate' },
      { name: 'Family Law Consultation', duration: 60, price: 350, category: 'Family' },
      { name: 'Real Estate Closing', duration: 120, price: 800, category: 'Real Estate' }
    ],
    customers: [
      { firstName: 'William', lastName: 'Scott', email: 'william.s@email.com', phone: '(555) 407-7001' },
      { firstName: 'Elizabeth', lastName: 'Green', email: 'elizabeth.g@email.com', phone: '(555) 407-7002' },
      { firstName: 'James', lastName: 'Baker', email: 'james.b@email.com', phone: '(555) 407-7003' }
    ]
  },
  real_estate: {
    name: 'Summit Realty Group',
    slug: 'summit-realty',
    email: 'admin@summitrealty.com',
    password: 'Realty2024!',
    phone: '(555) 208-1000',
    city: 'San Diego',
    state: 'CA',
    services: [
      { name: 'Property Showing', duration: 60, price: 0, category: 'Showing' },
      { name: 'Buyer Consultation', duration: 90, price: 0, category: 'Consultation' },
      { name: 'Listing Presentation', duration: 60, price: 0, category: 'Listing' },
      { name: 'Home Valuation', duration: 45, price: 0, category: 'Valuation' },
      { name: 'Open House', duration: 180, price: 0, category: 'Marketing' }
    ],
    customers: [
      { firstName: 'Daniel', lastName: 'Adams', email: 'daniel.a@email.com', phone: '(555) 408-8001' },
      { firstName: 'Michelle', lastName: 'Nelson', email: 'michelle.n@email.com', phone: '(555) 408-8002' },
      { firstName: 'Kevin', lastName: 'Carter', email: 'kevin.c@email.com', phone: '(555) 408-8003' }
    ]
  },
  veterinary: {
    name: 'Caring Paws Veterinary',
    slug: 'caring-paws',
    email: 'admin@caringpaws.com',
    password: 'Vet2024!',
    phone: '(555) 209-2000',
    city: 'Portland',
    state: 'OR',
    services: [
      { name: 'Wellness Exam', duration: 30, price: 65, category: 'Exam' },
      { name: 'Vaccination', duration: 15, price: 35, category: 'Preventive' },
      { name: 'Dental Cleaning', duration: 60, price: 300, category: 'Dental' },
      { name: 'Spay/Neuter Surgery', duration: 120, price: 350, category: 'Surgery' },
      { name: 'Emergency Visit', duration: 30, price: 150, category: 'Emergency' },
      { name: 'Grooming', duration: 90, price: 75, category: 'Grooming' }
    ],
    customers: [
      { firstName: 'Rachel', lastName: 'Mitchell', email: 'rachel.m@email.com', phone: '(555) 409-9001' },
      { firstName: 'Brian', lastName: 'Perez', email: 'brian.p@email.com', phone: '(555) 409-9002' },
      { firstName: 'Stephanie', lastName: 'Roberts', email: 'stephanie.r@email.com', phone: '(555) 409-9003' }
    ]
  },
  auto_sales: {
    name: 'Elite Auto Group',
    slug: 'elite-auto',
    email: 'admin@eliteauto.com',
    password: 'Auto2024!',
    phone: '(555) 210-3000',
    city: 'Dallas',
    state: 'TX',
    services: [
      { name: 'Test Drive', duration: 30, price: 0, category: 'Sales' },
      { name: 'Vehicle Appraisal', duration: 45, price: 0, category: 'Sales' },
      { name: 'Financing Consultation', duration: 60, price: 0, category: 'Finance' },
      { name: 'Vehicle Delivery', duration: 90, price: 0, category: 'Sales' },
      { name: 'Service Appointment', duration: 120, price: 150, category: 'Service' },
      { name: 'Oil Change', duration: 30, price: 45, category: 'Service' },
      { name: 'Tire Rotation', duration: 45, price: 60, category: 'Service' },
      { name: 'State Inspection', duration: 45, price: 25, category: 'Service' },
      { name: 'Detail Service', duration: 180, price: 200, category: 'Service' },
      { name: 'Parts Pickup', duration: 15, price: 0, category: 'Parts' }
    ],
    customers: [
      { firstName: 'Steven', lastName: 'Turner', email: 'steven.t@email.com', phone: '(555) 410-0001' },
      { firstName: 'Angela', lastName: 'Phillips', email: 'angela.p@email.com', phone: '(555) 410-0002' },
      { firstName: 'Brandon', lastName: 'Campbell', email: 'brandon.c@email.com', phone: '(555) 410-0003' }
    ]
  }
};

async function createAllIndustries() {
  console.log('🏢 Creating Test Businesses for All 10 Industries\n');
  console.log('━'.repeat(70));

  const results = {
    successful: [],
    failed: []
  };

  for (const [industryType, config] of Object.entries(industries)) {
    console.log(`\n📋 Industry: ${industryType.toUpperCase()}`);
    console.log(`🏢 Business: ${config.name}`);
    console.log('─'.repeat(70));

    try {
      // Step 1: Create business
      console.log('  1️⃣  Creating business...');
      const { data: business, error: bizError } = await supabase
        .from('businesses')
        .insert({
          name: config.name,
          slug: config.slug,
          business_type: industryType,
          email: config.email,
          phone: config.phone,
          city: config.city,
          state: config.state,
          country: 'US',
          timezone: 'America/Los_Angeles',
          subscription_tier: 'professional',
          subscription_status: 'active',
          onboarding_completed: true
        })
        .select()
        .single();

      if (bizError) {
        console.log(`     ❌ Failed:`, bizError.message);
        results.failed.push({ industry: industryType, error: bizError.message });
        continue;
      }

      console.log(`     ✅ Business created: ${business.id}`);

      // Step 2: Create auth user
      console.log('  2️⃣  Creating user account...');
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: config.email,
        password: config.password,
        email_confirm: true,
        user_metadata: {
          business_id: business.id,
          business_name: config.name
        }
      });

      if (authError) {
        console.log(`     ❌ Failed:`, authError.message);
        results.failed.push({ industry: industryType, error: authError.message });
        continue;
      }

      console.log(`     ✅ User created: ${authUser.user.id}`);

      // Step 3: Link user to business
      console.log('  3️⃣  Linking user to business...');
      const { error: linkError } = await supabase
        .from('business_users')
        .insert({
          business_id: business.id,
          user_id: authUser.user.id,
          role: 'owner'
        });

      if (linkError) {
        console.log(`     ⚠️  Link warning:`, linkError.message);
      } else {
        console.log(`     ✅ User linked`);
      }

      // Step 4: Create services
      console.log(`  4️⃣  Creating ${config.services.length} services...`);
      for (const service of config.services) {
        const { error: svcError } = await supabase
          .from('services')
          .insert({
            business_id: business.id,
            name: service.name,
            duration_minutes: service.duration,
            price: service.price,
            description: `${service.category} service`,
            is_active: true
          });

        if (svcError) {
          console.log(`     ⚠️  ${service.name}: ${svcError.message}`);
        } else {
          console.log(`     ✅ ${service.name} ($${service.price}, ${service.duration} min)`);
        }
      }

      // Step 5: Create customers
      console.log(`  5️⃣  Creating ${config.customers.length} customers...`);
      for (const customer of config.customers) {
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
          await supabase
            .from('business_customers')
            .insert({
              business_id: business.id,
              customer_id: cust.id
            });

          console.log(`     ✅ ${customer.firstName} ${customer.lastName}`);
        }
      }

      console.log(`\n  🎉 ${config.name} setup complete!`);
      results.successful.push({
        industry: industryType,
        business: config.name,
        businessId: business.id,
        email: config.email,
        password: config.password,
        services: config.services.length,
        customers: config.customers.length
      });

    } catch (error) {
      console.log(`  ❌ Unexpected error:`, error.message);
      results.failed.push({ industry: industryType, error: error.message });
    }
  }

  // Print Summary
  console.log('\n\n');
  console.log('━'.repeat(70));
  console.log('📊 SETUP SUMMARY');
  console.log('━'.repeat(70));
  console.log(`\n✅ Successful: ${results.successful.length}/10`);
  console.log(`❌ Failed: ${results.failed.length}/10\n`);

  if (results.successful.length > 0) {
    console.log('🔐 LOGIN CREDENTIALS:\n');
    console.log('━'.repeat(70));
    results.successful.forEach(r => {
      console.log(`\n🏢 ${r.business} (${r.industry})`);
      console.log(`   📧 Email: ${r.email}`);
      console.log(`   🔑 Password: ${r.password}`);
      console.log(`   🆔 Business ID: ${r.businessId}`);
      console.log(`   📦 Services: ${r.services} | Customers: ${r.customers}`);
    });
  }

  if (results.failed.length > 0) {
    console.log('\n\n❌ FAILED SETUPS:\n');
    results.failed.forEach(f => {
      console.log(`   • ${f.industry}: ${f.error}`);
    });
  }

  console.log('\n━'.repeat(70));
  console.log('🔗 Test at: http://localhost:3022/login');
  console.log('━'.repeat(70));
  console.log('\n✅ All industries ready for testing!\n');
}

createAllIndustries();
