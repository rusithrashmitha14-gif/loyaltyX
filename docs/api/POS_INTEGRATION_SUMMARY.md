# POS Integration API - Implementation Summary

## 📦 Files Created

### Database Schema
- ✅ `prisma/schema.prisma` - Updated with 4 new models:
  - `ApiKey` - API key management (production/sandbox)
  - `Webhook` - Webhook registrations
  - `WebhookDelivery` - Webhook delivery tracking
  - `IdempotencyKey` - Idempotency support (24hr expiry)

### Utility Libraries
- ✅ `src/lib/api-key-auth.ts` - API key authentication middleware
  - `authenticateApiKey()` - Validate x-api-key header
  - `generateApiKey()` - Generate secure API keys (lx_ prefix)
  - `generateWebhookSecret()` - Generate HMAC secrets

- ✅ `src/lib/idempotency.ts` - Idempotency handling
  - `checkIdempotency()` - Check if request was processed before
  - `storeIdempotentResponse()` - Cache response for 24 hours
  - `cleanupExpiredIdempotencyKeys()` - Cleanup task

- ✅ `src/lib/webhooks.ts` - Webhook system
  - `enqueueWebhook()` - Queue webhook for delivery
  - `processWebhookDeliveries()` - Process pending deliveries
  - `generateWebhookSignature()` - HMAC SHA-256 signature
  - `verifyWebhookSignature()` - Verify incoming webhooks

### API Endpoints

#### `/api/integrations/auth/`
- ✅ `route.ts`
  - `POST` - Generate new API key (requires JWT)
  - `GET` - List API keys (masked)

#### `/api/integrations/customers/`
- ✅ `route.ts`
  - `POST` - Create/update customer (upsert by email)
  - `GET` - List customers (filter by email/phone)
  - Supports: Idempotency-Key header

#### `/api/integrations/transactions/`
- ✅ `route.ts`
  - `POST` - Create transaction + award points
  - `GET` - List transactions (pagination)
  - Supports: Idempotency-Key header
  - Returns: `{pointsAwarded, newBalance}`

#### `/api/integrations/rewards/`
- ✅ `route.ts`
  - `GET` - List all rewards

#### `/api/integrations/redemptions/`
- ✅ `route.ts`
  - `POST` - Redeem reward + deduct points
  - `GET` - List redemptions (pagination)
  - Supports: Idempotency-Key header
  - Validates: Sufficient points before redemption

#### `/api/integrations/webhooks/register/`
- ✅ `route.ts`
  - `POST` - Register webhook URL with events
  - `GET` - List registered webhooks

### Documentation

- ✅ `docs/api/openapi.yaml` - OpenAPI 3.0 specification
  - All endpoints documented
  - Request/response schemas
  - Authentication flows
  - Example payloads

- ✅ `docs/api/postman_collection.json` - Postman collection
  - 8 pre-configured requests
  - Environment variables
  - Example payloads

- ✅ `docs/api/curl-examples.md` - cURL command examples
  - Complete flow walkthrough
  - Idempotency examples
  - Webhook verification code

- ✅ `docs/api/INTEGRATION_API.md` - Complete integration guide
  - Quick start guide
  - API reference
  - Code examples (Node.js, Python)
  - Best practices
  - Error handling

### Tests

- ✅ `tests/pos-integration.test.ts` - TypeScript test suite
  - Full POS flow simulation
  - API key generation
  - Customer creation
  - Transaction posting
  - Idempotency testing
  - Reward redemption
  - Webhook registration

- ✅ `tests/pos-flow.sh` - Bash test script
  - Complete integration flow
  - Color-coded output
  - Error handling
  - Summary report

### Configuration

- ✅ `package.json` - Added test scripts:
  - `npm run test:integration` - Run TypeScript tests
  - `npm run test:pos-flow` - Run bash script

## 🎯 Key Features Implemented

### ✅ 1. API Key Authentication
- Secure key generation (lx_ prefix + 64 random hex chars)
- Production vs Sandbox environments
- Last used tracking
- Active/inactive status

### ✅ 2. Idempotency Support
- Prevents duplicate transactions
- 24-hour caching window
- Automatic cleanup of expired keys
- Works with all write operations (POST)

### ✅ 3. Automatic Points System
- Formula: `points = floor(amount / 100)`
- Example: Rs. 5000 = 50 points
- Automatic calculation on transactions
- Atomic updates (database transaction)

### ✅ 4. Webhook System
- Event subscription (*, points_awarded, redemption_completed, etc.)
- HMAC SHA-256 signature
- Retry logic (5 attempts)
- Delivery status tracking

### ✅ 5. Customer Upsert
- Create or update by email
- Prevents duplicates
- Returns existing customer if email matches

### ✅ 6. Comprehensive Error Handling
- Clear error messages
- HTTP status codes
- Detailed error objects
- Validation errors

### ✅ 7. Pagination Support
- Transactions: limit/offset params
- Redemptions: limit/offset params
- Customers: filter by email/phone

## 🧪 Testing Instructions

### Prerequisites
1. Database must be running
2. Run `npm run db:push` to update schema
3. Run `npm run db:generate` to generate Prisma client
4. Start dev server: `npm run dev`

### Quick Test

```bash
# 1. Login and get JWT token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@loyaltyx.com","password":"password123"}' \
  | jq -r '.data.token'

# Save the token
export JWT_TOKEN="<token_from_above>"

# 2. Run integration tests
npm run test:integration

# Or run bash script
chmod +x tests/pos-flow.sh
npm run test:pos-flow
```

### Manual Test Flow

```bash
# Step 1: Generate API key
curl -X POST http://localhost:3000/api/integrations/auth \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test POS","environment":"sandbox"}' | jq '.'

# Save API key
export API_KEY="<key_from_response>"

# Step 2: Create customer
curl -X POST http://localhost:3000/api/integrations/customers \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test_customer_1" \
  -d '{"email":"test@pos.com","name":"Test User","phone":"+94771234567"}' | jq '.'

# Step 3: Post transaction
curl -X POST http://localhost:3000/api/integrations/transactions \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test_txn_1" \
  -d '{"customerEmail":"test@pos.com","amount":10000}' | jq '.'

# Step 4: Check points
curl -X GET "http://localhost:3000/api/integrations/customers?email=test@pos.com" \
  -H "x-api-key: $API_KEY" | jq '.data[0].points'

# Step 5: Redeem reward
curl -X POST http://localhost:3000/api/integrations/redemptions \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test_rdm_1" \
  -d '{"customerEmail":"test@pos.com","rewardId":1}' | jq '.'
```

## 🔄 Webhook Testing

### Setup Webhook Receiver (Local Testing)

```javascript
// webhook-receiver.js
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const WEBHOOK_SECRET = 'your_webhook_secret_here';

app.post('/webhooks/loyaltyx', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const event = req.headers['x-webhook-event'];
  
  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');
    
  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  console.log('✅ Webhook received:', event);
  console.log('📦 Payload:', req.body);
  
  res.json({ received: true });
});

app.listen(3001, () => {
  console.log('Webhook receiver listening on http://localhost:3001');
});
```

## 🎯 Integration Checklist

- [ ] Generate API key for production
- [ ] Store API key securely (environment variable)
- [ ] Implement customer lookup/create flow
- [ ] Integrate transaction posting on checkout
- [ ] Display points earned to customers
- [ ] Implement reward redemption
- [ ] Register webhook URL
- [ ] Implement webhook signature verification
- [ ] Test idempotency with duplicate requests
- [ ] Set up error handling and logging
- [ ] Test in sandbox before going live

## 📊 Database Migration

After updating schema, run:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or create migration
npm run db:migrate
```

## 🚨 Sandbox vs Production

### Sandbox Mode
- Use `environment: "sandbox"` when generating API key
- Safe testing environment
- No impact on production data

### Production Mode
- Use `environment: "production"`
- Real customer transactions
- Points are actually awarded/deducted

## 📈 Next Steps

1. **Update database schema**: Run `npm run db:push`
2. **Generate Prisma client**: Run `npm run db:generate`
3. **Test the endpoints**: Run `npm run test:pos-flow`
4. **Import Postman collection**: Use `docs/api/postman_collection.json`
5. **Read full docs**: See `docs/api/INTEGRATION_API.md`

## 🔗 API Endpoint URLs

Base URL: `http://localhost:3000/api/integrations`

- `POST /auth` - Generate API key
- `POST /customers` - Upsert customer
- `GET /customers` - List customers
- `POST /transactions` - Create transaction
- `GET /transactions` - List transactions
- `GET /rewards` - List rewards
- `POST /redemptions` - Redeem reward
- `GET /redemptions` - List redemptions
- `POST /webhooks/register` - Register webhook
- `GET /webhooks/register` - List webhooks

All endpoints are now live and ready for testing!

