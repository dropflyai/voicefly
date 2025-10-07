require('dotenv').config({ path: '.env.local' });
const https = require('https');
const fs = require('fs');

async function deploySchema() {
  console.log('🚀 Deploying schema via Supabase REST API...\n');

  const sql = fs.readFileSync('./CLEAN-SCHEMA-FIX.sql', 'utf8');

  // Extract project ref
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)[1];

  console.log(`📍 Project: ${projectRef}`);
  console.log(`📄 SQL size: ${sql.length} characters\n`);

  // Use PostgREST to execute SQL
  const options = {
    hostname: `${projectRef}.supabase.co`,
    port: 443,
    path: '/rest/v1/rpc/exec_sql',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'return=minimal'
    }
  };

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📊 Total statements: ${statements.length}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    // Skip pure comments
    if (statement.trim().startsWith('--')) continue;

    const data = JSON.stringify({ query: statement });

    const promise = new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 204) {
            successCount++;
            console.log(`✅ ${i + 1}/${statements.length}`);
            resolve();
          } else {
            errorCount++;
            console.log(`⚠️  ${i + 1}/${statements.length}: ${res.statusCode}`);
            resolve(); // Continue anyway
          }
        });
      });

      req.on('error', (error) => {
        errorCount++;
        console.log(`❌ ${i + 1}/${statements.length}: ${error.message}`);
        resolve(); // Continue anyway
      });

      req.write(data);
      req.end();
    });

    await promise;
  }

  console.log(`\n✅ Deployment complete!`);
  console.log(`   Success: ${successCount}/${statements.length}`);
  console.log(`   Errors: ${errorCount}/${statements.length}`);
}

deploySchema();
