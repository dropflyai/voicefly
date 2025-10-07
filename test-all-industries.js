const { chromium } = require('playwright');

const industries = [
  {
    name: 'Valley Medical Practice',
    type: 'medical_practice',
    email: 'admin@valleymedical.com',
    password: 'Medical2024!',
    expectedServices: ['Annual Physical Exam', 'Sick Visit', 'Telehealth Consultation'],
    terminology: { singular: 'Appointment', plural: 'Appointments' }
  },
  {
    name: 'Bright Smile Dentistry',
    type: 'dental_practice',
    email: 'admin@brightsmile.com',
    password: 'Dental2024!',
    expectedServices: ['Routine Cleaning', 'Dental Exam', 'Teeth Whitening'],
    terminology: { singular: 'Appointment', plural: 'Appointments' }
  },
  {
    name: 'Luxe Beauty Studio',
    type: 'beauty_salon',
    email: 'admin@luxebeauty.com',
    password: 'Beauty2024!',
    expectedServices: ['Haircut & Style', 'Color Treatment', 'Manicure'],
    terminology: { singular: 'Appointment', plural: 'Appointments' }
  },
  {
    name: 'Core Fitness Studio',
    type: 'fitness_wellness',
    email: 'admin@corefitness.com',
    password: 'Fitness2024!',
    expectedServices: ['Personal Training Session', 'Group Yoga Class', 'HIIT Training'],
    terminology: { singular: 'Session', plural: 'Sessions' }
  },
  {
    name: 'Premier Home Services',
    type: 'home_services',
    email: 'admin@premierhome.com',
    password: 'Home2024!',
    expectedServices: ['Plumbing Repair', 'Electrical Service', 'HVAC Maintenance'],
    terminology: { singular: 'Job', plural: 'Jobs' }
  },
  {
    name: 'Radiance MedSpa',
    type: 'medspa',
    email: 'admin@radiancemedspa.com',
    password: 'MedSpa2024!',
    expectedServices: ['Botox Treatment', 'Dermal Fillers', 'Laser Hair Removal'],
    terminology: { singular: 'Treatment', plural: 'Treatments' }
  },
  {
    name: 'Sterling Legal Group',
    type: 'law_firm',
    email: 'admin@sterlinglegal.com',
    password: 'Legal2024!',
    expectedServices: ['Initial Consultation', 'Contract Review', 'Estate Planning'],
    terminology: { singular: 'Consultation', plural: 'Consultations' }
  },
  {
    name: 'Summit Realty Group',
    type: 'real_estate',
    email: 'admin@summitrealty.com',
    password: 'Realty2024!',
    expectedServices: ['Property Showing', 'Buyer Consultation', 'Listing Presentation'],
    terminology: { singular: 'Showing', plural: 'Showings' }
  },
  {
    name: 'Caring Paws Veterinary',
    type: 'veterinary',
    email: 'admin@caringpaws.com',
    password: 'Vet2024!',
    expectedServices: ['Wellness Exam', 'Vaccination', 'Dental Cleaning'],
    terminology: { singular: 'Appointment', plural: 'Appointments' }
  },
  {
    name: 'Elite Auto Group',
    type: 'auto_sales',
    email: 'admin@eliteauto.com',
    password: 'Auto2024!',
    expectedServices: ['Test Drive', 'Vehicle Appraisal', 'Financing Consultation'],
    terminology: { singular: 'Appointment', plural: 'Appointments' }
  }
];

async function testIndustry(browser, industry, index) {
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log(`\n${'━'.repeat(70)}`);
  console.log(`🧪 Testing ${industry.name} (${industry.type})`);
  console.log('─'.repeat(70));

  const results = {
    industry: industry.name,
    type: industry.type,
    login: false,
    dashboard: false,
    services: false,
    customers: false,
    appointments: false,
    terminology: false,
    errors: []
  };

  try {
    // Step 1: Login
    console.log('1️⃣  Testing login...');
    await page.goto('http://localhost:3022/login');
    await page.waitForTimeout(2000);

    await page.fill('input[type="email"]', industry.email);
    await page.fill('input[type="password"]', industry.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      console.log('   ✅ Login successful');
      results.login = true;
    } else {
      console.log('   ❌ Login failed - not redirected to dashboard');
      results.errors.push('Login failed');
      await page.screenshot({ path: `test-${industry.type}-login-error.png` });
      return results;
    }

    // Step 2: Dashboard
    console.log('2️⃣  Testing dashboard...');
    await page.waitForTimeout(2000);
    const dashboardContent = await page.textContent('body');

    if (dashboardContent.includes('Dashboard') || dashboardContent.includes(industry.name)) {
      console.log('   ✅ Dashboard loaded');
      results.dashboard = true;
      await page.screenshot({ path: `test-${industry.type}-dashboard.png` });
    } else {
      console.log('   ⚠️  Dashboard may not have loaded correctly');
      results.errors.push('Dashboard load uncertain');
    }

    // Step 3: Services
    console.log('3️⃣  Testing services page...');
    await page.goto('http://localhost:3022/dashboard/services');
    await page.waitForTimeout(2000);

    const servicesContent = await page.textContent('body');
    let servicesFound = 0;

    for (const service of industry.expectedServices) {
      if (servicesContent.includes(service)) {
        servicesFound++;
      }
    }

    if (servicesFound >= 2) {
      console.log(`   ✅ Services loaded (found ${servicesFound}/${industry.expectedServices.length})`);
      results.services = true;
    } else {
      console.log(`   ⚠️  Only found ${servicesFound}/${industry.expectedServices.length} expected services`);
      results.errors.push(`Services: only ${servicesFound} found`);
    }

    await page.screenshot({ path: `test-${industry.type}-services.png` });

    // Step 4: Customers
    console.log('4️⃣  Testing customers page...');
    await page.goto('http://localhost:3022/dashboard/customers');
    await page.waitForTimeout(2000);

    const customersContent = await page.textContent('body');
    if (customersContent.includes('Customer') || customersContent.includes('Client')) {
      console.log('   ✅ Customers page loaded');
      results.customers = true;
    } else {
      console.log('   ⚠️  Customers page may not have loaded correctly');
      results.errors.push('Customers page uncertain');
    }

    await page.screenshot({ path: `test-${industry.type}-customers.png` });

    // Step 5: Appointments (with terminology check)
    console.log('5️⃣  Testing appointments/terminology...');
    await page.goto('http://localhost:3022/dashboard/appointments');
    await page.waitForTimeout(2000);

    const appointmentsContent = await page.textContent('body');
    const hasCorrectTerminology =
      appointmentsContent.toLowerCase().includes(industry.terminology.singular.toLowerCase()) ||
      appointmentsContent.toLowerCase().includes(industry.terminology.plural.toLowerCase());

    if (hasCorrectTerminology) {
      console.log(`   ✅ Correct terminology found: "${industry.terminology.plural}"`);
      results.terminology = true;
      results.appointments = true;
    } else {
      console.log(`   ⚠️  Expected terminology "${industry.terminology.plural}" not clearly visible`);
      results.errors.push(`Terminology "${industry.terminology.plural}" not found`);
      results.appointments = appointmentsContent.includes('appointment') || appointmentsContent.includes('schedule');
    }

    await page.screenshot({ path: `test-${industry.type}-appointments.png` });

    // Overall assessment
    const passedTests = [
      results.login,
      results.dashboard,
      results.services,
      results.customers,
      results.appointments
    ].filter(Boolean).length;

    console.log(`\n📊 Score: ${passedTests}/5 tests passed`);
    if (passedTests >= 4) {
      console.log('✅ Industry configuration: WORKING');
    } else {
      console.log('⚠️  Industry configuration: NEEDS REVIEW');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
    results.errors.push(error.message);
    await page.screenshot({ path: `test-${industry.type}-error.png`, fullPage: true });
  } finally {
    await context.close();
  }

  return results;
}

async function testAllIndustries() {
  console.log('🧪 VoiceFly - Testing All 10 Industries\n');
  console.log('━'.repeat(70));
  console.log('This will test login, dashboard, services, customers, and terminology');
  console.log('for each industry vertical to verify custom configurations.\n');

  const browser = await chromium.launch({ headless: false });
  const allResults = [];

  for (let i = 0; i < industries.length; i++) {
    const results = await testIndustry(browser, industries[i], i + 1);
    allResults.push(results);

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  await browser.close();

  // Print Summary Report
  console.log('\n\n');
  console.log('━'.repeat(70));
  console.log('📊 INDUSTRY TESTING SUMMARY REPORT');
  console.log('━'.repeat(70));
  console.log();

  const fullyWorking = allResults.filter(r =>
    r.login && r.dashboard && r.services && r.customers && r.appointments
  );
  const partiallyWorking = allResults.filter(r =>
    r.login && (r.dashboard || r.services || r.customers)
  );
  const notWorking = allResults.filter(r => !r.login);

  console.log(`✅ Fully Working: ${fullyWorking.length}/10`);
  console.log(`⚠️  Partially Working: ${partiallyWorking.length - fullyWorking.length}/10`);
  console.log(`❌ Not Working: ${notWorking.length}/10`);
  console.log();

  console.log('━'.repeat(70));
  console.log('DETAILED RESULTS:');
  console.log('━'.repeat(70));
  console.log();

  allResults.forEach((result, index) => {
    const score = [
      result.login,
      result.dashboard,
      result.services,
      result.customers,
      result.appointments
    ].filter(Boolean).length;

    const status = score === 5 ? '✅' : score >= 3 ? '⚠️ ' : '❌';

    console.log(`${status} ${result.industry} (${result.type})`);
    console.log(`   Score: ${score}/5`);
    console.log(`   Login: ${result.login ? '✅' : '❌'} | Dashboard: ${result.dashboard ? '✅' : '❌'} | Services: ${result.services ? '✅' : '❌'} | Customers: ${result.customers ? '✅' : '❌'} | Appointments: ${result.appointments ? '✅' : '❌'}`);
    console.log(`   Terminology: ${result.terminology ? '✅' : '⚠️ '}`);

    if (result.errors.length > 0) {
      console.log(`   Issues: ${result.errors.join(', ')}`);
    }
    console.log();
  });

  console.log('━'.repeat(70));
  console.log('📸 SCREENSHOTS SAVED:');
  console.log('━'.repeat(70));
  allResults.forEach(result => {
    console.log(`   • test-${result.type}-dashboard.png`);
    console.log(`   • test-${result.type}-services.png`);
    console.log(`   • test-${result.type}-customers.png`);
    console.log(`   • test-${result.type}-appointments.png`);
  });
  console.log();

  console.log('━'.repeat(70));
  console.log('✅ Industry testing complete!');
  console.log('━'.repeat(70));
  console.log();
}

testAllIndustries();
