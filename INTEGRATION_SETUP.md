# 🎉 LoyaltyX POS Integration API - Complete Implementation

## 📋 Summary of Files Created

### 🗄️ Database Schema (`prisma/schema.prisma`)
Added 4 new models:

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `ApiKey` | API key management | key, businessId, environment, isActive |
| `Webhook` | Webhook registrations | url, events, secret |
| `WebhookDelivery` | Delivery tracking | webhookId, status, attempts |
| `IdempotencyKey` | Duplicate prevention | key, response, expiresAt |

**Status:** ✅ Schema updated and pushed to database

### 🔧 Utility Libraries

| File | Purpose | Key Functions |
|------|---------|---------------|
| `src/lib/api-key-auth.ts` | API key authentication | `authenticateApiKey()`, `generateApiKey()` |
| `src/lib/idempotency.ts` | Idempotency handling | `checkIdempotency()`, `storeIdempotentResponse()` |
| `src/lib/webhooks.ts` | Webhook system | `enqueueWebhook()`, `generateWebhookSignature()` |

### 🌐 API Endpoints (`src/app/api/integrations/`)

#### 1. `/auth/route.ts`
- `POST /api/integrations/auth` - Generate API key (JWT auth required)
- `GET /api/integrations/auth` - List API keys (masked)

#### 2. `/customers/route.ts`
- `POST /api/integrations/customers` - Upsert customer (idempotent)
- `GET /api/integrations/customers` - List/search customers

#### 3. `/transactions/route.ts`
- `POST /api/integrations/transactions` - Create transaction + award points (idempotent)
- `GET /api/integrations/transactions` - List transactions (paginated)

#### 4. `/rewards/route.ts`
- `GET /api/integrations/rewards` - List all rewards

#### 5. `/redemptions/route.ts`
- `POST /api/integrations/redemptions` - Redeem reward + deduct points (idempotent)
- `GET /api/integrations/redemptions` - List redemptions (paginated)

#### 6. `/webhooks/register/route.ts`
- `POST /api/integrations/webhooks/register` - Register webhook URL
- `GET /api/integrations/webhooks/register` - List webhooks

### 📚 Documentation

| File | Description |
|------|-------------|
| `docs/api/openapi.yaml` | OpenAPI 3.0 specification (Swagger) |
| `docs/api/postman_collection.json` | Postman collection (8 requests) |
| `docs/api/curl-examples.md` | cURL command examples |
| `docs/api/INTEGRATION_API.md` | Complete integration guide |
| `docs/api/QUICKSTART.md` | 5-minute quick start |
| `docs/api/POS_INTEGRATION_SUMMARY.md` | Technical summary |

### 🧪 Tests

| File | Purpose |
|------|---------|
| `tests/pos-integration.test.ts` | TypeScript integration tests |
| `tests/pos-flow.sh` | Bash script - full POS flow simulation |

**Test Commands Added to package.json:**
- `npm run test:integration` - Run TypeScript tests
- `npm run test:pos-flow` - Run bash script

## 🚀 Setup Instructions

### 1. Update Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

**Output should show:**
```
Your database is now in sync with your Prisma schema. Done in 1.04s
✔ Generated Prisma Client
```

### 2. Generate Your First API Key

```bash
# Login to get JWT token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@loyaltyx.com","password":"password123"}'

# Save the token
export JWT_TOKEN="<token_from_response>"

# Generate API key
curl -X POST http://localhost:3000/api/integrations/auth \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"name":"Main POS","environment":"sandbox"}' | jq '.'

# Save the API key
export API_KEY="<key_from_response>"
```

### 3. Test the Integration

```bash
# Run the automated test suite
chmod +x tests/pos-flow.sh
./tests/pos-flow.sh
```

This will:
- ✅ Login and get JWT token
- ✅ Generate API key
- ✅ Create a test customer
- ✅ Post multiple transactions
- ✅ Test idempotency
- ✅ Check points balance
- ✅ Redeem a reward
- ✅ Register a webhook

## 🎯 Key Features

### ✅ Idempotency Support
Prevents duplicate transactions even with network retries:
```bash
# Same Idempotency-Key = Same response, no duplicate
-H "Idempotency-Key: txn_12345"
```

### ✅ Automatic Points Calculation
Formula: `points = floor(amount / 100)`

| Amount (LKR) | Points Earned |
|--------------|---------------|
| 5,000 | 50 |
| 10,000 | 100 |
| 15,750 | 157 |

### ✅ Webhook Notifications
Real-time event delivery with HMAC signatures:
- `points_awarded`
- `redemption_completed`
- `customer_created`
- `transaction_created`

### ✅ Customer Upsert
Create or update by email - no duplicates:
```javascript
// First call: Creates customer
POST /customers {"email":"john@example.com", "name":"John"}

// Second call: Updates name
POST /customers {"email":"john@example.com", "name":"John Doe"}
```

### ✅ Sandbox Support
Test safely without affecting production data:
```javascript
{"environment": "sandbox"}
```

## 📊 API Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "transactionId": 123,
    "pointsAwarded": 50,
    "newBalance": 200
  },
  "message": "Transaction created successfully"
}
```

### Error Response
```json
{
  "error": "Insufficient points",
  "details": {
    "required": 100,
    "available": 50,
    "shortage": 50
  }
}
```

## 🔐 Authentication

All requests require the `x-api-key` header:

```bash
curl -H "x-api-key: lx_your_api_key_here" \
  http://localhost:3000/api/integrations/rewards
```

## 📖 Documentation

- **OpenAPI Spec**: `docs/api/openapi.yaml` (import to Swagger UI)
- **Postman Collection**: `docs/api/postman_collection.json`
- **Full Guide**: `docs/api/INTEGRATION_API.md`
- **cURL Examples**: `docs/api/curl-examples.md`

## 🧪 Testing

### Option 1: Automated Test Suite
```bash
export JWT_TOKEN="your_token_here"
npm run test:integration
```

### Option 2: Bash Script (Recommended)
```bash
chmod +x tests/pos-flow.sh
./tests/pos-flow.sh
```

**Test Output:**
```
🚀 Starting POS Integration Tests

📝 Test 1: Generating API Key...
✅ API Key generated: lx_a1b2c3d4e5f6...

📝 Test 2: Creating Customer...
✅ Customer created: { id: 3, name: "POS Test Customer", points: 0 }

📝 Test 3: Creating Transaction (Rs. 15000)...
✅ Transaction created
   Points awarded: 150
   New balance: 150 points

📝 Test 4: Testing Idempotency...
✅ Idempotency working - no duplicate created

...

🎉 All POS Integration Tests Passed!
```

## 🔄 Complete POS Flow Example

```javascript
// Your POS system code

const LOYALTYX_API_KEY = process.env.LOYALTYX_API_KEY;
const BASE_URL = 'http://localhost:3000/api/integrations';

async function processSale(saleData) {
  // 1. Create/update customer
  const customer = await fetch(`${BASE_URL}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': LOYALTYX_API_KEY,
      'Idempotency-Key': `cust_${saleData.customerEmail}`,
    },
    body: JSON.stringify({
      email: saleData.customerEmail,
      name: saleData.customerName,
      phone: saleData.customerPhone,
    }),
  }).then(r => r.json());

  // 2. Create transaction
  const transaction = await fetch(`${BASE_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': LOYALTYX_API_KEY,
      'Idempotency-Key': `txn_${saleData.receiptId}`,
    },
    body: JSON.stringify({
      customerId: customer.data.id,
      amount: saleData.total,
    }),
  }).then(r => r.json());

  // 3. Display on POS screen
  console.log(`✅ Points earned: ${transaction.data.pointsAwarded}`);
  console.log(`📊 Total points: ${transaction.data.newBalance}`);
  
  // 4. Print on receipt
  return {
    pointsEarned: transaction.data.pointsAwarded,
    totalPoints: transaction.data.newBalance,
  };
}
```

## 🎁 Redeem Reward Example

```javascript
async function redeemReward(customerEmail, rewardId) {
  const redemption = await fetch(`${BASE_URL}/redemptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': LOYALTYX_API_KEY,
      'Idempotency-Key': `rdm_${Date.now()}`,
    },
    body: JSON.stringify({
      customerEmail,
      rewardId,
    }),
  }).then(r => r.json());

  if (redemption.success) {
    console.log(`✅ ${redemption.data.rewardTitle} redeemed!`);
    console.log(`📊 Remaining points: ${redemption.data.newBalance}`);
    return true;
  } else {
    console.error(`❌ ${redemption.error}`);
    if (redemption.details) {
      console.log(`Need ${redemption.details.shortage} more points`);
    }
    return false;
  }
}
```

## 📞 Support

For help with integration:
- Check `docs/api/INTEGRATION_API.md`
- Review `docs/api/curl-examples.md`
- Run test suite to verify setup

## ✨ Features Checklist

- ✅ API key authentication (x-api-key header)
- ✅ Idempotency support (Idempotency-Key header)
- ✅ Customer upsert (create/update by email)
- ✅ Transaction creation with automatic points
- ✅ Points calculation (amount / 100)
- ✅ Reward redemption with validation
- ✅ Webhook registration and delivery
- ✅ HMAC webhook signatures
- ✅ Sandbox/Production environments
- ✅ Pagination for list endpoints
- ✅ Clear error responses
- ✅ OpenAPI documentation
- ✅ Postman collection
- ✅ cURL examples
- ✅ Integration test suite

**Everything is ready to use!** 🚀

