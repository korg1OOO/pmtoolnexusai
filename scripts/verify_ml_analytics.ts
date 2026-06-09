/**
 * ML Analytics Module Verification Script
 * Tests database schema, Edge Functions, and service layer integration
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/integrations/supabase/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

interface TestResult {
    name: string;
    status: 'PASS' | 'FAIL' | 'SKIP';
    message: string;
}

const results: TestResult[] = [];

async function testDatabaseSchema() {
    console.log('\n=== Testing Database Schema ===\n');

    // Test ml_predictions table
    try {
        const { error } = await supabase
            .from('ml_predictions')
            .select('*')
            .limit(0);

        if (error) {
            results.push({
                name: 'ml_predictions table exists',
                status: 'FAIL',
                message: error.message,
            });
        } else {
            results.push({
                name: 'ml_predictions table exists',
                status: 'PASS',
                message: 'Table accessible',
            });
        }
    } catch (err: any) {
        results.push({
            name: 'ml_predictions table exists',
            status: 'FAIL',
            message: err.message,
        });
    }

    // Test ml_model_metadata table
    try {
        const { error } = await supabase
            .from('ml_model_metadata')
            .select('*')
            .limit(0);

        if (error) {
            results.push({
                name: 'ml_model_metadata table exists',
                status: 'FAIL',
                message: error.message,
            });
        } else {
            results.push({
                name: 'ml_model_metadata table exists',
                status: 'PASS',
                message: 'Table accessible',
            });
        }
    } catch (err: any) {
        results.push({
            name: 'ml_model_metadata table exists',
            status: 'FAIL',
            message: err.message,
        });
    }

    // Test ml_training_data table
    try {
        const { error } = await supabase
            .from('ml_training_data')
            .select('*')
            .limit(0);

        if (error) {
            results.push({
                name: 'ml_training_data table exists',
                status: 'FAIL',
                message: error.message,
            });
        } else {
            results.push({
                name: 'ml_training_data table exists',
                status: 'PASS',
                message: 'Table accessible',
            });
        }
    } catch (err: any) {
        results.push({
            name: 'ml_training_data table exists',
            status: 'FAIL',
            message: err.message,
        });
    }
}

async function testMLServices() {
    console.log('\n=== Testing ML Services ===\n');

    // Get a test project
    const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .limit(1);

    if (!projects || projects.length === 0) {
        results.push({
            name: 'ML Services',
            status: 'SKIP',
            message: 'No test projects available',
        });
        return;
    }

    const testProjectId = projects[0].id;

    // Test risk prediction
    try {
        const { data, error } = await supabase.functions.invoke('ml-predict-risks', {
            body: { projectId: testProjectId },
        });

        if (error) {
            results.push({
                name: 'Risk Prediction Service',
                status: 'FAIL',
                message: error.message,
            });
        } else if (data && data.overall_score !== undefined) {
            results.push({
                name: 'Risk Prediction Service',
                status: 'PASS',
                message: `Returned risk score: ${data.overall_score}`,
            });
        } else {
            results.push({
                name: 'Risk Prediction Service',
                status: 'FAIL',
                message: 'Invalid response format',
            });
        }
    } catch (err: any) {
        results.push({
            name: 'Risk Prediction Service',
            status: 'FAIL',
            message: err.message,
        });
    }

    // Test cost forecasting
    try {
        const { data, error } = await supabase.functions.invoke('ml-forecast-costs', {
            body: { projectId: testProjectId },
        });

        if (error) {
            results.push({
                name: 'Cost Forecasting Service',
                status: 'FAIL',
                message: error.message,
            });
        } else if (data && data.total_forecast !== undefined) {
            results.push({
                name: 'Cost Forecasting Service',
                status: 'PASS',
                message: `Returned forecast: $${data.total_forecast.toLocaleString()}`,
            });
        } else {
            results.push({
                name: 'Cost Forecasting Service',
                status: 'FAIL',
                message: 'Invalid response format',
            });
        }
    } catch (err: any) {
        results.push({
            name: 'Cost Forecasting Service',
            status: 'FAIL',
            message: err.message,
        });
    }

    // Test schedule delay prediction
    try {
        const { data, error } = await supabase.functions.invoke('ml-predict-delays', {
            body: { projectId: testProjectId },
        });

        if (error) {
            results.push({
                name: 'Schedule Delay Service',
                status: 'FAIL',
                message: error.message,
            });
        } else if (data && data.total_predicted_days !== undefined) {
            results.push({
                name: 'Schedule Delay Service',
                status: 'PASS',
                message: `Predicted duration: ${data.total_predicted_days} days`,
            });
        } else {
            results.push({
                name: 'Schedule Delay Service',
                status: 'FAIL',
                message: 'Invalid response format',
            });
        }
    } catch (err: any) {
        results.push({
            name: 'Schedule Delay Service',
            status: 'FAIL',
            message: err.message,
        });
    }
}

async function testCaching() {
    console.log('\n=== Testing Caching Behavior ===\n');

    const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .limit(1);

    if (!projects || projects.length === 0) {
        results.push({
            name: 'Caching',
            status: 'SKIP',
            message: 'No test projects available',
        });
        return;
    }

    const testProjectId = projects[0].id;

    // First call - should create cache
    const start1 = Date.now();
    const { data: data1 } = await supabase.functions.invoke('ml-predict-risks', {
        body: { projectId: testProjectId },
    });
    const duration1 = Date.now() - start1;

    // Second call - should use cache
    const start2 = Date.now();
    const { data: data2 } = await supabase.functions.invoke('ml-predict-risks', {
        body: { projectId: testProjectId },
    });
    const duration2 = Date.now() - start2;

    if (data2 && data2.from_cache) {
        results.push({
            name: 'Prediction Caching',
            status: 'PASS',
            message: `First call: ${duration1}ms, Cached call: ${duration2}ms`,
        });
    } else {
        results.push({
            name: 'Prediction Caching',
            status: 'FAIL',
            message: 'Cache not utilized',
        });
    }
}

async function printResults() {
    console.log('\n=== Test Results Summary ===\n');

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const skipped = results.filter(r => r.status === 'SKIP').length;

    results.forEach(result => {
        const emoji = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
        console.log(`${emoji} ${result.name}: ${result.message}`);
    });

    console.log(`\n📊 Total: ${results.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed} | ⏭️ Skipped: ${skipped}\n`);

    if (failed > 0) {
        console.error('❌ Verification failed! Please review errors above.');
        process.exit(1);
    } else {
        console.log('✅ All tests passed!');
        process.exit(0);
    }
}

async function main() {
    console.log('🧠 ML Analytics Module - Verification\n');
    console.log('=====================================\n');

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');
        process.exit(1);
    }

    await testDatabaseSchema();
    await testMLServices();
    await testCaching();
    await printResults();
}

main().catch(console.error);
