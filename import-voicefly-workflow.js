#!/usr/bin/env node

/**
 * Import VoiceFly Booking Workflow to N8N
 * This script imports the post-booking automation workflow
 */

const fs = require('fs');
const path = require('path');

// N8N Configuration
const N8N_API_URL = 'https://qhclwxce56fvanvzp5omvffm.hooks.n8n.cloud/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTEyODc0Ni0yNTk3LTRkYjAtYmQzNy1hMzBkZTQ3MjRjZjAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUzMjg4NTYzfQ.fBaYlJW8FewpxM3FLyidyV8aiPcq09knZ3jf2qXa8yY';

async function importWorkflow() {
    try {
        console.log('🚀 Importing VoiceFly Booking Workflow to N8N...');

        // Read the workflow file
        const workflowPath = path.join(__dirname, 'vapi-nail-salon-agent', 'n8n-post-booking-workflow.json');

        if (!fs.existsSync(workflowPath)) {
            console.error('❌ Workflow file not found:', workflowPath);
            return;
        }

        const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
        console.log('✅ Workflow file loaded:', workflowData.name);

        // Prepare workflow for import
        const importData = {
            name: 'VoiceFly - Post Booking Automation',
            active: false, // Import as inactive first
            nodes: workflowData.nodes,
            connections: workflowData.connections,
            settings: workflowData.settings || {}
        };

        console.log('📡 Sending to N8N API...');
        console.log('API URL:', N8N_API_URL);

        // Make API request to import workflow
        const response = await fetch(`${N8N_API_URL}/workflows`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-N8N-API-KEY': N8N_API_KEY
            },
            body: JSON.stringify(importData)
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('❌ API Error:', response.status, error);
            return;
        }

        const result = await response.json();
        console.log('✅ Workflow imported successfully!');
        console.log('📋 Workflow ID:', result.id);
        console.log('📝 Workflow Name:', result.name);

        console.log(`
🎉 VoiceFly Booking Workflow Import Complete!

Next Steps:
1. Open N8N Editor: https://qhclwxce56fvanvzp5omvffm.hooks.n8n.cloud
2. Configure credentials:
   - Twilio (for SMS)
   - Gmail (for email)
   - Supabase (for database)
3. Activate the workflow
4. Test with a booking

Webhook URL: https://qhclwxce56fvanvzp5omvffm.hooks.n8n.cloud/webhook/booking-automation
`);

    } catch (error) {
        console.error('❌ Import failed:', error.message);
    }
}

// Run if called directly
if (require.main === module) {
    importWorkflow();
}

module.exports = { importWorkflow };