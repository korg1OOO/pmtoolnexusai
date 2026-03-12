const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const SUPABASE_PROJECT_REF = 'wmnfuwmjauslyqqucmov';
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Read the Edge Function code
const functionPath = path.join(__dirname, '../supabase/functions/create-payment-intent/index.ts');
const functionCode = fs.readFileSync(functionPath, 'utf8');

console.log('🚀 Deploying Edge Function to Supabase...');
console.log(`Project: ${SUPABASE_PROJECT_REF}`);
console.log(`Function: create-payment-intent`);

// Prepare the deployment payload
const payload = JSON.stringify({
    slug: 'create-payment-intent',
    name: 'create-payment-intent',
    verify_jwt: false,
    import_map: false,
    entrypoint_path: 'index.ts',
    code: functionCode
});

const options = {
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${SUPABASE_PROJECT_REF}/functions`,
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
    }
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('✅ Edge Function deployed successfully!');
            console.log('Response:', JSON.parse(data));

            // Now set the Stripe secret
            console.log('\n🔐 Setting Stripe secret...');
            setStripeSecret();
        } else {
            console.error('❌ Deployment failed!');
            console.error('Status:', res.statusCode);
            console.error('Response:', data);
            process.exit(1);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Error deploying function:', error);
    process.exit(1);
});

req.write(payload);
req.end();

function setStripeSecret() {
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
        console.warn('⚠️  STRIPE_SECRET_KEY not found in .env');
        console.log('Please set it manually using:');
        console.log('  supabase secrets set STRIPE_SECRET_KEY=sk_test_...');
        return;
    }

    const secretPayload = JSON.stringify({
        name: 'STRIPE_SECRET_KEY',
        value: stripeKey
    });

    const secretOptions = {
        hostname: 'api.supabase.com',
        port: 443,
        path: `/v1/projects/${SUPABASE_PROJECT_REF}/secrets`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(secretPayload)
        }
    };

    const secretReq = https.request(secretOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            if (res.statusCode === 200 || res.statusCode === 201) {
                console.log('✅ Stripe secret set successfully!');
                console.log('\n🎉 Deployment complete!');
                console.log('\nEdge Function URL:');
                console.log(`https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/create-payment-intent`);
            } else {
                console.warn('⚠️  Failed to set Stripe secret');
                console.warn('Status:', res.statusCode);
                console.warn('Response:', data);
                console.log('\nPlease set it manually using Supabase dashboard');
            }
        });
    });

    secretReq.on('error', (error) => {
        console.error('❌ Error setting secret:', error);
    });

    secretReq.write(secretPayload);
    secretReq.end();
}
