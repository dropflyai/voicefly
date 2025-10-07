require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyAndFixLinks() {
  console.log('🔍 Verifying Business-User Links\n');
  console.log('━'.repeat(70));

  // Get all businesses
  const { data: businesses, error: bizError } = await supabase
    .from('businesses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(15);

  if (bizError) {
    console.log('❌ Error fetching businesses:', bizError.message);
    return;
  }

  console.log(`\n📊 Found ${businesses.length} businesses\n`);

  for (const business of businesses) {
    console.log(`\n🏢 ${business.name} (${business.business_type})`);
    console.log(`   ID: ${business.id}`);
    console.log(`   Email: ${business.email}`);

    // Check if business_users link exists
    const { data: links, error: linkError } = await supabase
      .from('business_users')
      .select('*, user_id')
      .eq('business_id', business.id);

    if (linkError) {
      console.log(`   ⚠️  Error checking links:`, linkError.message);
      continue;
    }

    if (links && links.length > 0) {
      console.log(`   ✅ Linked to ${links.length} user(s)`);
      links.forEach(link => {
        console.log(`      • User: ${link.user_id} (${link.role})`);
      });
    } else {
      console.log(`   ❌ NOT LINKED - Attempting to fix...`);

      // Try to find user with matching email
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) {
        console.log(`      ⚠️  Can't list users:`, authError.message);
        continue;
      }

      const matchingUser = authUsers.users.find(u => u.email === business.email);

      if (matchingUser) {
        console.log(`      🔗 Found matching user: ${matchingUser.id}`);

        // Create the link
        const { error: createLinkError } = await supabase
          .from('business_users')
          .insert({
            business_id: business.id,
            user_id: matchingUser.id,
            role: 'owner'
          });

        if (createLinkError) {
          console.log(`      ❌ Failed to create link:`, createLinkError.message);
        } else {
          console.log(`      ✅ Link created successfully!`);
        }
      } else {
        console.log(`      ⚠️  No matching user found for ${business.email}`);
      }
    }
  }

  console.log('\n\n━'.repeat(70));
  console.log('✅ Verification complete!\n');
}

verifyAndFixLinks();
