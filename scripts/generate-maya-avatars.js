/**
 * Generate Maya Avatar Options using DALL-E
 * Run: node scripts/generate-maya-avatars.js
 */

require('dotenv').config({ path: '.env.local' });

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const https = require('https');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const avatarPrompts = [
  // Style A: Headset Professional
  {
    id: 'headset-a1',
    name: 'Headset Pro - Warm',
    prompt: 'Professional portrait of a friendly female AI phone employee wearing a sleek modern wireless headset, warm confident smile, business casual attire, clean gradient blue background, subtle glowing circuit line details on the headset, 28 years old, soft studio lighting, high quality digital illustration'
  },
  {
    id: 'headset-a2',
    name: 'Headset Pro - Bold',
    prompt: 'Bold professional portrait of a female AI call center employee wearing a futuristic phone headset, confident expression, sharp blazer, deep navy blue background with subtle tech grid lines, glowing accent lights on headset, polished and capable, digital art portrait style'
  },
  {
    id: 'headset-a3',
    name: 'Headset Pro - Illustrated',
    prompt: 'Clean illustrated character of a female AI phone employee, modern headset with a soft glow, professional attire, friendly smile, flat design illustration style, blue and purple gradient color palette, SaaS product mascot style, 24/7 always-on vibe'
  },
  {
    id: 'headset-a4',
    name: 'Headset Pro - Night Shift',
    prompt: 'Portrait of a professional female AI phone employee wearing a glowing headset, working at night, dark background with cool blue ambient glow, suggesting 24/7 availability, calm and focused expression, futuristic but approachable, digital art style'
  },
  // Style D: Holographic/Digital Avatar
  {
    id: 'holo-d1',
    name: 'Holographic - Classic',
    prompt: 'Holographic digital avatar of a professional female AI employee, semi-transparent glowing blue projection effect, wearing a phone headset, friendly expression, dark background with subtle grid lines, futuristic sci-fi aesthetic, clean and professional, digital art'
  },
  {
    id: 'holo-d2',
    name: 'Holographic - Warm Glow',
    prompt: 'Glowing holographic portrait of a female AI voice assistant, warm blue and purple translucent effect, soft human features, wearing a modern headset, floating in dark space with particle effects, professional yet otherworldly, high quality digital illustration'
  },
  {
    id: 'holo-d3',
    name: 'Holographic - Minimal',
    prompt: 'Minimalist holographic avatar of a female AI phone employee, clean glowing outline style, simple geometric face with warm expression, circuit pattern background, blue and cyan color palette, modern tech company aesthetic, flat design meets hologram'
  },
  {
    id: 'holo-d4',
    name: 'Holographic - Vibrant',
    prompt: 'Vibrant holographic AI employee avatar, female figure with a modern headset, glowing neon blue and purple digital projection, dynamic and energetic, dark background, suggests always-on 24/7 availability, futuristic SaaS brand aesthetic, digital art portrait'
  }
];

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      fileStream.on('error', reject);
    });
  });
}

async function generateAvatars() {
  const outputDir = path.join(__dirname, '../public/maya-avatars');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🎨 Generating Maya avatar options with DALL-E...\n');

  const results = [];

  for (let i = 0; i < avatarPrompts.length; i++) {
    const { id, name, prompt } = avatarPrompts[i];

    console.log(`[${i + 1}/${avatarPrompts.length}] Generating: ${name}...`);

    try {
      const response = await openai.images.generate({
        model: 'dall-e-2',
        prompt: prompt,
        n: 1,
        size: '1024x1024'
      });

      const imageUrl = response.data[0].url;
      const filepath = path.join(outputDir, `${id}.png`);

      await downloadImage(imageUrl, filepath);

      results.push({
        id,
        name,
        prompt,
        filepath: `/maya-avatars/${id}.png`,
        generated: true
      });

      console.log(`   ✓ Saved: ${filepath}\n`);

      // Wait 1 second between requests to avoid rate limits
      if (i < avatarPrompts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`   ✗ Error generating ${name}:`, error.message);
      results.push({
        id,
        name,
        prompt,
        error: error.message,
        generated: false
      });
    }
  }

  // Save metadata
  const metadataPath = path.join(outputDir, 'avatars.json');
  fs.writeFileSync(metadataPath, JSON.stringify(results, null, 2));

  console.log('\n✅ Avatar generation complete!');
  console.log(`📁 Saved to: ${outputDir}`);
  console.log(`📋 Metadata: ${metadataPath}`);
  console.log(`\n🌐 View avatars at: http://localhost:3000/maya-avatar-picker`);

  return results;
}

// Run the generator
generateAvatars().catch(console.error);
