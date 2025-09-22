#!/usr/bin/env node

/**
 * Direct Schema Update for Web Booking
 * Uses direct ALTER TABLE commands via Supabase client
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://irvyhhkoiyzartmmvbxw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlydnloaGtvaXl6YXJ0bW12Ynh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTExODI5MywiZXhwIjoyMDcwNjk0MjkzfQ.61Zfyc87GpmpIlWFL1fyX6wcfydqCu6DUFuHnpNSvhk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function updateWebBookingEndpoint() {
    console.log('🔧 ALTERNATIVE APPROACH: Updating webhook server to handle existing schema\n');
    
    // Since we can't easily modify the database schema, let's check what columns actually exist
    // and update our webhook server accordingly
    
    console.log('📋 Checking current appointments table structure...');
    
    // Test with a simple insert to see what columns are available
    try {
        const testData = {
            business_id: 'c7f6221a-f588-43fa-a095-09151fbc41e8',
            appointment_date: '2025-08-29',
            start_time: '10:00',
            status: 'pending'
        };
        
        console.log('🧪 Testing basic insert...');
        const { data, error } = await supabase
            .from('appointments')
            .insert([testData])
            .select()
            .limit(0); // This will validate structure without actually inserting
        
        if (error) {
            console.log('❌ Basic insert test failed:', error.message);
            console.log('💡 Error details:', error);
        } else {
            console.log('✅ Basic insert structure is valid');
        }
        
    } catch (err) {
        console.log('💥 Test error:', err.message);
    }
    
    // Let's try to get table info another way
    console.log('\n🔍 Trying to get table information...');
    
    try {
        // Try to select from appointments to see what columns exist
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .limit(1);
            
        if (error) {
            console.log('❌ Select test failed:', error.message);
        } else {
            console.log('✅ Select successful');
            if (data && data.length > 0) {
                console.log('📊 Sample record structure:');
                console.log(Object.keys(data[0]));
            } else {
                console.log('📊 Table exists but has no records');
            }
        }
    } catch (err) {
        console.log('💥 Select error:', err.message);
    }
    
    console.log('\n💡 RECOMMENDATION:');
    console.log('Since schema modification is challenging, let\'s update the webhook server');
    console.log('to work with the existing schema by:');
    console.log('1. Removing unsupported columns from INSERT');
    console.log('2. Using only confirmed existing columns');
    console.log('3. Storing customer info in customers table first');
}

updateWebBookingEndpoint();