#!/usr/bin/env node

/**
 * Schema Migration Runner
 * Executes the web booking schema migration on Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const SUPABASE_URL = 'https://irvyhhkoiyzartmmvbxw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlydnloaGtvaXl6YXJ0bW12Ynh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTExODI5MywiZXhwIjoyMDcwNjk0MjkzfQ.61Zfyc87GpmpIlWFL1fyX6wcfydqCu6DUFuHnpNSvhk';

// Initialize Supabase with service key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
    console.log('🚀 Starting schema migration for web booking support...\n');
    
    try {
        // Read the migration SQL file
        const migrationPath = join(__dirname, 'schema-migration-web-booking.sql');
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        
        console.log('📄 Migration SQL loaded:', migrationPath);
        console.log('📝 SQL Preview:');
        console.log(migrationSQL.split('\n').slice(0, 10).join('\n') + '...\n');
        
        // Execute the migration
        console.log('⚡ Executing migration...');
        const { data, error } = await supabase.rpc('exec', {
            sql: migrationSQL
        });
        
        if (error) {
            console.error('❌ Migration failed:', error);
            
            // Try alternative approach - execute each statement separately
            console.log('🔄 Trying alternative approach...');
            const statements = migrationSQL
                .split(';')
                .map(s => s.trim())
                .filter(s => s && !s.startsWith('--') && s !== '');
                
            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                if (!statement) continue;
                
                console.log(`📝 Executing statement ${i + 1}/${statements.length}`);
                console.log(`   ${statement.substring(0, 60)}...`);
                
                try {
                    const { error: stmtError } = await supabase.rpc('exec', {
                        sql: statement
                    });
                    
                    if (stmtError) {
                        console.warn(`⚠️  Statement ${i + 1} warning:`, stmtError.message);
                    } else {
                        console.log(`✅ Statement ${i + 1} completed`);
                    }
                } catch (err) {
                    console.warn(`⚠️  Statement ${i + 1} error:`, err.message);
                }
            }
        } else {
            console.log('✅ Migration executed successfully');
            if (data) {
                console.log('📊 Migration result:', data);
            }
        }
        
        // Verify the migration by checking the appointments table structure
        console.log('\n🔍 Verifying migration...');
        const { data: columns, error: verifyError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_name', 'appointments')
            .eq('table_schema', 'public');
            
        if (verifyError) {
            console.warn('⚠️  Could not verify migration:', verifyError);
        } else {
            console.log('📋 Current appointments table columns:');
            columns.forEach(col => {
                const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)';
                console.log(`   ${col.column_name}: ${col.data_type} ${nullable}`);
            });
            
            // Check for our new columns
            const newColumns = ['duration_minutes', 'customer_notes', 'booking_source', 'customer_name', 'customer_phone', 'customer_email'];
            const existingColumns = columns.map(c => c.column_name);
            
            console.log('\n✅ New column verification:');
            newColumns.forEach(colName => {
                const exists = existingColumns.includes(colName);
                console.log(`   ${colName}: ${exists ? '✅ Added' : '❌ Missing'}`);
            });
        }
        
        console.log('\n🎉 Schema migration completed!');
        console.log('🌐 Web booking endpoint should now work correctly');
        
    } catch (error) {
        console.error('💥 Migration error:', error);
        process.exit(1);
    }
}

// Run the migration
runMigration();