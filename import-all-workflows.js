#!/usr/bin/env node

/**
 * Import All VoiceFly Workflows to N8N
 * Imports all workflow JSON files from n8n-workflows directory
 */

const fs = require('fs');
const path = require('path');

// N8N Configuration
const N8N_API_URL = 'https://qhclwxce56fvanvzp5omvffm.hooks.n8n.cloud/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTEyODc0Ni0yNTk3LTRkYjAtYmQzNy1hMzBkZTQ3MjRjZjAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUzMjg4NTYzfQ.fBaYlJW8FewpxM3FLyidyV8aiPcq09knZ3jf2qXa8yY';

const workflowsDir = path.join(__dirname, 'n8n-workflows');

async function importWorkflow(workflowFile) {
    try {
        const workflowPath = path.join(workflowsDir, workflowFile);

        if (!fs.existsSync(workflowPath)) {
            console.error(`❌ Workflow file not found: ${workflowFile}`);
            return { success: false, file: workflowFile, error: 'File not found' };
        }

        const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
        console.log(`\n📦 Importing: ${workflowData.name || workflowFile}`);

        // Prepare workflow for import
        const importData = {
            name: workflowData.name,
            active: false, // Import as inactive first
            nodes: workflowData.nodes,
            connections: workflowData.connections,
            settings: workflowData.settings || {}
        };

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
            console.error(`❌ API Error for ${workflowFile}:`, response.status, error);
            return { success: false, file: workflowFile, error: `${response.status}: ${error}` };
        }

        const result = await response.json();
        console.log(`✅ Imported: ${result.name} (ID: ${result.id})`);

        return {
            success: true,
            file: workflowFile,
            workflowId: result.id,
            workflowName: result.name
        };

    } catch (error) {
        console.error(`❌ Failed to import ${workflowFile}:`, error.message);
        return { success: false, file: workflowFile, error: error.message };
    }
}

async function importAllWorkflows() {
    console.log('🚀 VoiceFly Workflow Import Tool\n');
    console.log(`N8N Instance: ${N8N_API_URL}`);
    console.log(`Workflows Directory: ${workflowsDir}\n`);

    // Get all JSON files in workflows directory
    if (!fs.existsSync(workflowsDir)) {
        console.error(`❌ Workflows directory not found: ${workflowsDir}`);
        console.log('Creating directory...');
        fs.mkdirSync(workflowsDir, { recursive: true });
        console.log('✅ Created directory');
        return;
    }

    const workflowFiles = fs.readdirSync(workflowsDir)
        .filter(file => file.endsWith('.json'));

    if (workflowFiles.length === 0) {
        console.log('⚠️  No workflow files found in n8n-workflows directory');
        return;
    }

    console.log(`Found ${workflowFiles.length} workflow(s) to import:\n`);
    workflowFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file}`);
    });
    console.log('');

    // Import all workflows
    const results = [];
    for (const workflowFile of workflowFiles) {
        const result = await importWorkflow(workflowFile);
        results.push(result);

        // Small delay between imports
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(60) + '\n');

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`✅ Successful: ${successful.length}`);
    successful.forEach(r => {
        console.log(`   - ${r.workflowName} (${r.file})`);
    });

    if (failed.length > 0) {
        console.log(`\n❌ Failed: ${failed.length}`);
        failed.forEach(r => {
            console.log(`   - ${r.file}: ${r.error}`);
        });
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Next Steps:');
    console.log('='.repeat(60));
    console.log(`
1. Open N8N Editor: ${N8N_API_URL.replace('/api/v1', '')}
2. Configure credentials for each workflow:
   - Gmail OAuth2 (for email workflows)
   - Twilio (for SMS workflows)
   - Supabase (for database access)
3. Activate the workflows
4. Test each workflow with sample data
5. Monitor execution logs

Note: All workflows are imported as INACTIVE for safety.
You must configure credentials and activate them manually.
`);
}

// Run if called directly
if (require.main === module) {
    importAllWorkflows()
        .then(() => {
            console.log('✅ Import process completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Import process failed:', error);
            process.exit(1);
        });
}

module.exports = { importAllWorkflows, importWorkflow };
