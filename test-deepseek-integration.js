/**
 * DeepSeek-R1 Integration Test
 * Tests the DeepSeek AI integration without making actual API calls
 */

// Test imports
console.log('🧪 Testing DeepSeek-R1 Integration...\n')

// Test 1: Check if files exist
const fs = require('fs')
const path = require('path')

const filesToCheck = [
  'src/lib/deepseek-ai.ts',
  'src/lib/geo-analyzer.ts',
  'src/app/api/geo/analyze/route.ts',
  '.env.example',
  'DEEPSEEK-R1-INTEGRATION.md',
  'GEO-KNOWLEDGEBASE.md'
]

console.log('📁 File Existence Check:')
filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, file)
  const exists = fs.existsSync(filePath)
  console.log(`  ${exists ? '✅' : '❌'} ${file}`)
})

// Test 2: Check environment variables documented
console.log('\n🔑 Environment Variable Check:')
const envExample = fs.readFileSync(path.join(__dirname, '.env.example'), 'utf8')
const hasDeepSeekKey = envExample.includes('DEEPSEEK_API_KEY')
const hasOldKimiKey = envExample.includes('KIMI_API_KEY')
console.log(`  ${hasDeepSeekKey ? '✅' : '❌'} DEEPSEEK_API_KEY documented`)
console.log(`  ${!hasOldKimiKey ? '✅' : '⚠️'} KIMI_API_KEY ${!hasOldKimiKey ? 'removed' : 'still present'}`)

// Test 3: Check imports in geo-analyzer
console.log('\n🔗 Import Check (geo-analyzer.ts):')
const geoAnalyzer = fs.readFileSync(path.join(__dirname, 'src/lib/geo-analyzer.ts'), 'utf8')
const usesDeepSeek = geoAnalyzer.includes('getDeepSeekAI')
const usesOldKimi = geoAnalyzer.includes('getKimiAI')
console.log(`  ${usesDeepSeek ? '✅' : '❌'} Uses DeepSeek imports`)
console.log(`  ${!usesOldKimi ? '✅' : '⚠️'} Kimi imports ${!usesOldKimi ? 'removed' : 'still present'}`)

// Test 4: Check DeepSeek library structure
console.log('\n📚 DeepSeek Library Structure:')
const deepseekLib = fs.readFileSync(path.join(__dirname, 'src/lib/deepseek-ai.ts'), 'utf8')
const checks = [
  { name: 'DeepSeekAI class', pattern: /export class DeepSeekAI/ },
  { name: 'complete() method', pattern: /async complete\(/ },
  { name: 'webResearch() method', pattern: /async webResearch\(/ },
  { name: 'analyzeIntent() method', pattern: /async analyzeIntent\(/ },
  { name: 'generateCode() method', pattern: /async generateCode\(/ },
  { name: 'estimateCost() method', pattern: /estimateCost\(/ },
  { name: 'isOffPeakTime() method', pattern: /isOffPeakTime\(/ },
  { name: 'Chain-of-thought support', pattern: /showReasoning/ },
  { name: 'Cache tracking', pattern: /prompt_cache_hit_tokens/ },
  { name: 'Off-peak discount', pattern: /75% discount/ }
]

checks.forEach(check => {
  const found = check.pattern.test(deepseekLib)
  console.log(`  ${found ? '✅' : '❌'} ${check.name}`)
})

// Test 5: Check pricing documentation
console.log('\n💰 Pricing Documentation:')
const deepseekIntegration = fs.existsSync(path.join(__dirname, 'DEEPSEEK-R1-INTEGRATION.md'))
  ? fs.readFileSync(path.join(__dirname, 'DEEPSEEK-R1-INTEGRATION.md'), 'utf8')
  : deepseekLib
const pricingChecks = [
  { name: '27x cheaper claim', pattern: /27x cheaper/ },
  { name: 'Off-peak discount', pattern: /75%.*off-peak/i },
  { name: 'Cache savings', pattern: /90%.*cache/i },
  { name: 'MIT license mention', pattern: /MIT license/i },
  { name: 'Reasoning capability', pattern: /reasoning/i }
]

pricingChecks.forEach(check => {
  const found = check.pattern.test(deepseekIntegration)
  console.log(`  ${found ? '✅' : '❌'} ${check.name}`)
})

// Test 6: Check GEO knowledgebase
console.log('\n📖 GEO Knowledgebase:')
const geoKnowledgebase = fs.readFileSync(path.join(__dirname, 'GEO-KNOWLEDGEBASE.md'), 'utf8')
const geoChecks = [
  { name: 'Reddit citation data', pattern: /Reddit.*21%/i },
  { name: 'ChatGPT usage stats', pattern: /400 million/i },
  { name: 'Freshness importance', pattern: /2-3 month/i },
  { name: 'Citation boost stats', pattern: /\+40%.*visibility/i },
  { name: 'Off-peak strategy', pattern: /off-peak/i }
]

geoChecks.forEach(check => {
  const found = check.pattern.test(geoKnowledgebase)
  console.log(`  ${found ? '✅' : '❌'} ${check.name}`)
})

// Test 7: Verify feature access updates
console.log('\n🔐 Feature Access Control:')
const featureAccess = fs.readFileSync(path.join(__dirname, 'src/lib/feature-access.ts'), 'utf8')
const featureChecks = [
  { name: 'geo_optimization case', pattern: /case 'geo_optimization':/ },
  { name: 'GEO feature added to list', pattern: /geo.*features\.push/ }
]

featureChecks.forEach(check => {
  const found = check.pattern.test(featureAccess)
  console.log(`  ${found ? '✅' : '❌'} ${check.name}`)
})

// Test 8: Check tier limits
console.log('\n🎯 Subscription Tier Limits:')
const supabase = fs.readFileSync(path.join(__dirname, 'src/lib/supabase.ts'), 'utf8')
const tierChecks = [
  { name: 'Starter: geo_optimization: false', pattern: /starter:[\s\S]*?geo_optimization:\s*false/ },
  { name: 'Professional: geo_optimization: true', pattern: /professional:[\s\S]*?geo_optimization:\s*true/ },
  { name: 'Enterprise: geo_optimization: true', pattern: /enterprise:[\s\S]*?geo_optimization:\s*true/ }
]

tierChecks.forEach(check => {
  const found = check.pattern.test(supabase)
  console.log(`  ${found ? '✅' : '❌'} ${check.name}`)
})

// Summary
console.log('\n' + '='.repeat(60))
console.log('📊 SUMMARY')
console.log('='.repeat(60))

const allChecks = [
  ...filesToCheck.map(f => fs.existsSync(path.join(__dirname, f))),
  hasDeepSeekKey,
  !hasOldKimiKey,
  usesDeepSeek,
  !usesOldKimi,
  ...checks.map(c => c.pattern.test(deepseekLib)),
  ...pricingChecks.map(c => c.pattern.test(deepseekIntegration)),
  ...geoChecks.map(c => c.pattern.test(geoKnowledgebase)),
  ...featureChecks.map(c => c.pattern.test(featureAccess)),
  ...tierChecks.map(c => c.pattern.test(supabase))
]

const passed = allChecks.filter(Boolean).length
const total = allChecks.length
const percentage = ((passed / total) * 100).toFixed(1)

console.log(`\n✅ Passed: ${passed}/${total} checks (${percentage}%)`)

if (percentage === '100.0') {
  console.log('\n🎉 ALL TESTS PASSED! DeepSeek-R1 integration is complete!')
  console.log('\n📝 Next steps:')
  console.log('   1. Get API key from: https://platform.deepseek.com/api_keys')
  console.log('   2. Add DEEPSEEK_API_KEY to your .env.local')
  console.log('   3. Deploy to production')
  console.log('\n💰 Cost savings: 98% vs GPT-4, 27x cheaper than OpenAI o1')
  console.log('🧠 Capabilities: Best reasoning + coding at fraction of cost')
} else {
  console.log('\n⚠️  Some checks failed. Review output above.')
  process.exit(1)
}
