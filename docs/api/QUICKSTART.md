# POS Integration API - Quick Start Guide

## ⚡ Get Started in 5 Minutes

### Step 1: Update Database Schema

```bash
npm run db:generate
npm run db:push
```

### Step 2: Get Your JWT Token

1. Start the dev server: `npm run dev`
2. Login at http://localhost:3000/login
   - Email: `demo@loyaltyx.com`
   - Password: `password123`
3. Open browser console and run:
   ```javascript
   localStorage.getItem('loyaltyx_token')
   ```
4. Copy the token

### Step 3: Generate API Key

```bash
export JWT_TOKEN="your_token_here"

curl -X POST http://localhost:3000/api/integrations/auth \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "name": "My POS System",
    "environment": "sandbox"
  }' | jq '.data.key'
```

Save the API key!

### Step 4: Test the Integration

```bash
export API_KEY="lx_your_api_key_here"

# Create a customer
curl -X POST http://localhost:3000/api/integrations/customers \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "Idempotency-Key: cust_$(date +%s)" \
  -d '{
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "+94 77 123 4567"
  }' | jq '.'

# Create a transaction (Rs. 10000 = 100 points)
curl -X POST http://localhost:3000/api/integrations/transactions \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "Idempotency-Key: txn_$(date +%s)" \
  -d '{
    "customerEmail": "john@example.com",
    "amount": 10000.00
  }' | jq '.'
```

### Step 5: Run Automated Tests

```bash
# Option 1: TypeScript test suite
JWT_TOKEN="$JWT_TOKEN" npm run test:integration

# Option 2: Bash script (comprehensive)
chmod +x tests/pos-flow.sh
./tests/pos-flow.sh
```

## 🎯 What You Get

✅ **Customer Management**
- Create/update customers (upsert by email)
- Lookup by email or phone
- Automatic points tracking

✅ **Transaction Processing**
- Record purchases
- Automatic points calculation (amount ÷ 100)
- Atomic points updates
- Idempotency support (no duplicates)

✅ **Reward Redemption**
- List available rewards
- Validate sufficient points
- Automatic point deduction
- Idempotency support

✅ **Webhooks**
- Real-time event notifications
- HMAC signature verification
- Configurable event subscriptions
- Automatic retry logic

✅ **Security**
- API key authentication
- Production vs Sandbox environments
- Idempotency (24hr cache)
- HMAC webhook signatures

## 📚 Next Steps

1. **Read the full docs**: `docs/api/INTEGRATION_API.md`
2. **Import Postman collection**: `docs/api/postman_collection.json`
3. **View OpenAPI spec**: `docs/api/openapi.yaml`
4. **Try cURL examples**: `docs/api/curl-examples.md`

## 🆘 Troubleshooting

### Database Connection Error
```bash
# Check if MySQL is running
# Update DATABASE_URL in .env.local
npm run db:push
```

### API Key Invalid
- Make sure you're using the correct API key
- Check if key is active: `GET /api/integrations/auth`
- Generate a new key if needed

### Idempotency Not Working
- Ensure `Idempotency-Key` header is included
- Key must be unique for each new request
- Same key returns cached response (intended behavior)

## 💡 Tips

- **Use sandbox mode** for testing
- **Always include** `Idempotency-Key` for POST requests
- **Store API keys** in environment variables, never in code
- **Verify webhook signatures** to prevent spoofing
- **Handle errors gracefully** with proper logging

## 🎉 You're Ready!

Your POS system can now:
- ✅ Create customers
- ✅ Record transactions
- ✅ Award points automatically
- ✅ Process reward redemptions
- ✅ Receive real-time webhooks

Happy integrating! 🚀

