# Edge Function Deployment Guide (Using .env Credentials)

## 🚀 Quick Deployment

### Step 1: Get Required Credentials

**1. Stripe Secret Key:**
- Go to https://dashboard.stripe.com/apikeys
- Copy your **Secret key** (starts with `sk_test_` for test mode)
- Add to `.env`:
  ```
  STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
  ```

**2. Supabase Access Token:**
- Go to https://supabase.com/dashboard/account/tokens
- Click "Generate New Token"
- Give it a name (e.g., "Edge Function Deployment")
- Copy the token
- Add to `.env`:
  ```
  SUPABASE_ACCESS_TOKEN=your_access_token_here
  ```

### Step 2: Run Deployment Script

```bash
node scripts/deploy_edge_function.cjs
```

This will:
1. Deploy the `create-payment-intent` Edge Function
2. Set the `STRIPE_SECRET_KEY` secret in Supabase
3. Display the function URL

---

## 📋 What the Script Does

The deployment script (`scripts/deploy_edge_function.cjs`):

1. **Reads credentials** from `.env` file
2. **Reads the Edge Function code** from `supabase/functions/create-payment-intent/index.ts`
3. **Deploys via Supabase Management API** (no CLI needed!)
4. **Sets Stripe secret** in Supabase environment
5. **Displays function URL** for testing

---

## ✅ Verification

After deployment, test the function:

```bash
curl -i --location --request POST \
  'https://wmnfuwmjauslyqqucmov.supabase.co/functions/v1/create-payment-intent' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "amount": 1000,
    "currency": "usd",
    "metadata": {
      "test": "true"
    }
  }'
```

Expected response:
```json
{
  "id": "pi_...",
  "client_secret": "pi_..._secret_...",
  "amount": 1000,
  "currency": "usd",
  "status": "requires_payment_method"
}
```

---

## 🔐 Security Notes

- ✅ Uses Supabase Management API (no CLI required)
- ✅ Credentials loaded from `.env` file
- ✅ Stripe secret stored securely in Supabase
- ⚠️  Never commit `.env` file to git
- ⚠️  Use test keys for development
- ⚠️  Switch to live keys for production

---

## 🐛 Troubleshooting

### Error: "SUPABASE_ACCESS_TOKEN not found"
- Make sure you've added the token to `.env`
- Get token from: https://supabase.com/dashboard/account/tokens

### Error: "Unauthorized"
- Verify your access token is valid
- Check if token has expired
- Regenerate token if needed

### Error: "Function already exists"
- The function is already deployed
- Script will update the existing function

### Error: "STRIPE_SECRET_KEY not found"
- Add your Stripe key to `.env`
- Get key from: https://dashboard.stripe.com/apikeys

---

## 🎉 Success!

Once deployed, your Edge Function will be available at:
```
https://wmnfuwmjauslyqqucmov.supabase.co/functions/v1/create-payment-intent
```

You can now use it in your application for processing payments!
