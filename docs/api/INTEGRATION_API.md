# LoyaltyX POS Integration API

Complete API documentation for integrating your Point-of-Sale system with LoyaltyX.

## 🚀 Quick Start

### 1. Generate API Key

First, login to your LoyaltyX account and generate an API key:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "demo@loyaltyx.com", "password": "password123"}'

# Generate API key
curl -X POST http://localhost:3000/api/integrations/auth \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "My POS System", "environment": "production"}'
```

### 2. Make Your First Request

```bash
curl -X GET http://localhost:3000/api/integrations/rewards \
  -H "x-api-key: YOUR_API_KEY"
```

## 🔐 Authentication

All integration API requests require an API key in the `x-api-key` header:

```
x-api-key: lx_your_api_key_here
```

### API Key Format
- Prefix: `lx_`
- Length: 67 characters total
- Example: `lx_a1b2c3d4e5f6...`

### Environments
- **Production**: Real transactions and customer data
- **Sandbox**: Testing environment (isolated data)

## 🔄 Idempotency

All write operations (POST) support idempotency to prevent duplicate requests.

### How It Works
1. Generate a unique `Idempotency-Key` for each request
2. Include it in the request header
3. If the same key is used again within 24 hours, the API returns the cached response
4. No duplicate transaction/customer/redemption is created

### Example

```bash
# First request
curl -X POST http://localhost:3000/api/integrations/transactions \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "Idempotency-Key: txn_12345" \
  -d '{"customerEmail": "test@example.com", "amount": 5000}'
# → Creates transaction, returns ID 100

# Retry with same key (network error, etc.)
curl -X POST http://localhost:3000/api/integrations/transactions \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "Idempotency-Key: txn_12345" \
  -d '{"customerEmail": "test@example.com", "amount": 5000}'
# → Returns cached response, transaction ID still 100, no duplicate!
```

### Recommended Idempotency Key Formats
- Transactions: `txn_{timestamp}_{random}`
- Customers: `cust_{email_hash}`
- Redemptions: `rdm_{customer_id}_{reward_id}_{timestamp}`

## 📊 Points System

### Calculation Formula
```
points = floor(amount / 100)
```

### Examples
- Rs. 5,000 → 50 points
- Rs. 15,750 → 157 points
- Rs. 99 → 0 points

### Point Events
1. **Transaction Created** → Points added to customer
2. **Reward Redeemed** → Points deducted from customer
3. **Transaction Deleted** → Points removed from customer
4. **Redemption Deleted** → Points restored to customer

## 🔔 Webhooks

### Supported Events
- `*` - All events
- `points_awarded` - When points are added to a customer
- `redemption_completed` - When a reward is redeemed
- `customer_created` - When a new customer is created
- `transaction_created` - When a transaction is recorded

### Register a Webhook

```bash
curl -X POST http://localhost:3000/api/integrations/webhooks/register \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "url": "https://yourpos.com/webhooks/loyaltyx",
    "events": ["points_awarded", "redemption_completed"]
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "url": "https://yourpos.com/webhooks/loyaltyx",
    "events": ["points_awarded", "redemption_completed"],
    "secret": "webhook_secret_abc123...",
    "createdAt": "2025-10-10T12:00:00Z"
  },
  "message": "Webhook registered successfully..."
}
```

**⚠️ Store the secret securely!** It's only shown once and is used to verify webhook signatures.

### Webhook Payload Structure

```json
{
  "event": "points_awarded",
  "data": {
    "customerId": 1,
    "pointsAwarded": 50,
    "newBalance": 200,
    "reason": "transaction"
  },
  "businessId": 1,
  "timestamp": "2025-10-10T12:30:00Z"
}
```

### Webhook Headers
```
X-Webhook-Signature: abc123def456...
X-Webhook-Event: points_awarded
Content-Type: application/json
```

### Verify Webhook Signature

**Node.js:**
```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

**Python:**
```python
import hmac
import hashlib
import json

def verify_webhook(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        json.dumps(payload).encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected)
```

## 📡 API Endpoints

### Base URL
```
http://localhost:3000/api/integrations
```

### Endpoints

| Method | Endpoint | Description | Idempotent |
|--------|----------|-------------|------------|
| POST | `/auth` | Generate API key | No |
| GET | `/auth` | List API keys (masked) | - |
| POST | `/customers` | Create/update customer | Yes |
| GET | `/customers` | List customers | - |
| POST | `/transactions` | Create transaction | Yes |
| GET | `/transactions` | List transactions | - |
| GET | `/rewards` | List rewards | - |
| POST | `/redemptions` | Redeem reward | Yes |
| GET | `/redemptions` | List redemptions | - |
| POST | `/webhooks/register` | Register webhook | No |
| GET | `/webhooks/register` | List webhooks | - |

## 🧪 Testing

### Run Test Suite

```bash
# Set your JWT token
export JWT_TOKEN="your_jwt_token_here"

# Run TypeScript tests
npm run test:integration

# Or run shell script
chmod +x tests/pos-flow.sh
./tests/pos-flow.sh
```

### Manual Testing Flow

1. **Generate API Key**
2. **Create a customer**
3. **Post a transaction** (Rs. 5000 → 50 points)
4. **Check customer points** (should be 50)
5. **List rewards**
6. **Redeem a reward** (if enough points)
7. **Verify webhook delivery**

## 🎯 Common Integration Patterns

### Pattern 1: Sale Completion

```javascript
// When a sale is completed at POS
async function completeSale(sale) {
  // 1. Ensure customer exists
  const customer = await fetch('/api/integrations/customers', {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
      'Idempotency-Key': `cust_${sale.customerEmail}`,
    },
    body: JSON.stringify({
      email: sale.customerEmail,
      name: sale.customerName,
      phone: sale.customerPhone,
    }),
  }).then(r => r.json());

  // 2. Create transaction
  const transaction = await fetch('/api/integrations/transactions', {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
      'Idempotency-Key': `txn_${sale.id}`,
    },
    body: JSON.stringify({
      customerId: customer.data.id,
      amount: sale.total,
    }),
  }).then(r => r.json());

  // 3. Show points earned to customer
  console.log(`Points earned: ${transaction.data.pointsAwarded}`);
  console.log(`Total points: ${transaction.data.newBalance}`);
  
  return transaction;
}
```

### Pattern 2: Reward Redemption at Checkout

```javascript
async function redeemRewardAtCheckout(customerEmail, rewardId) {
  const redemption = await fetch('/api/integrations/redemptions', {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
      'Idempotency-Key': `rdm_${Date.now()}`,
    },
    body: JSON.stringify({
      customerEmail,
      rewardId,
    }),
  }).then(r => r.json());

  if (redemption.success) {
    console.log(`Reward applied: ${redemption.data.rewardTitle}`);
    console.log(`Remaining points: ${redemption.data.newBalance}`);
  } else {
    console.error(`Cannot redeem: ${redemption.error}`);
  }
  
  return redemption;
}
```

### Pattern 3: Customer Lookup

```javascript
async function findCustomerByEmail(email) {
  const response = await fetch(
    `/api/integrations/customers?email=${encodeURIComponent(email)}`,
    {
      headers: {
        'x-api-key': API_KEY,
      },
    }
  ).then(r => r.json());

  if (response.data.length > 0) {
    const customer = response.data[0];
    console.log(`Customer: ${customer.name}`);
    console.log(`Points: ${customer.points}`);
    return customer;
  }
  
  return null;
}
```

## ⚠️ Error Handling

### Common Errors

#### Unauthorized (401)
```json
{
  "error": "Invalid API key"
}
```
**Solution:** Check your API key

#### Customer Not Found (404)
```json
{
  "error": "Customer not found"
}
```
**Solution:** Create customer first using POST `/customers`

#### Insufficient Points (400)
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
**Solution:** Customer needs more points (additional purchases)

#### Missing Required Fields (400)
```json
{
  "error": "Missing required fields: email, name"
}
```
**Solution:** Include all required fields in request

## 🔒 Security Best Practices

1. **Never expose API keys in client-side code**
2. **Use HTTPS in production** (plain HTTP in development only)
3. **Rotate API keys periodically**
4. **Validate webhook signatures** to prevent spoofing
5. **Use idempotency keys** for all write operations
6. **Implement rate limiting** in your POS system
7. **Log all API interactions** for audit trails

## 📈 Rate Limits

Currently no rate limits are enforced, but best practices:
- Max 100 requests per second
- Implement exponential backoff for retries
- Cache customer data when possible

## 🆘 Support

For integration support:
- Documentation: `/docs/api/`
- OpenAPI Spec: `/docs/api/openapi.yaml`
- Postman Collection: `/docs/api/postman_collection.json`

## 📝 Changelog

### Version 1.0.0
- Initial release
- Customer upsert
- Transaction creation with automatic points
- Reward redemption
- Webhook support
- Idempotency for all write operations

