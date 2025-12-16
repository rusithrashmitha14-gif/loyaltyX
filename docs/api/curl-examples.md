# LoyaltyX POS Integration API - cURL Examples

## Prerequisites

1. **Get your JWT token** by logging in:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@loyaltyx.com",
    "password": "password123"
  }'
```

Save the `token` from the response.

## Step 1: Generate API Key (Admin)

```bash
export JWT_TOKEN="your_jwt_token_here"

curl -X POST http://localhost:3000/api/integrations/auth \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "name": "Main Store POS",
    "environment": "sandbox"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Main Store POS",
    "key": "lx_a1b2c3d4e5f6...",
    "environment": "sandbox",
    "isActive": true,
    "createdAt": "2025-10-10T12:00:00Z"
  },
  "message": "API key generated successfully. Store this key securely - it will not be shown again."
}
```

Save the `key` value as your API key.

## Step 2: Create a Sandbox Customer

```bash
export API_KEY="lx_your_api_key_here"

curl -X POST http://localhost:3000/api/integrations/customers \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "Idempotency-Key: customer_$(date +%s)" \
  -d '{
    "email": "jane.doe@example.com",
    "name": "Jane Doe",
    "phone": "+1 (555) 999-8888"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "phone": "+1 (555) 999-8888",
    "points": 0
  },
  "message": "Customer created/updated successfully"
}
```

## Step 3: Post a Transaction (with Idempotency-Key)

```bash
# Generate unique idempotency key
IDEMPOTENCY_KEY="txn_$(date +%s)_$(uuidgen 2>/dev/null || echo $RANDOM)"

curl -X POST http://localhost:3000/api/integrations/transactions \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d '{
    "customerEmail": "jane.doe@example.com",
    "amount": 5000.00
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": 10,
    "customerId": 3,
    "amount": 5000.00,
    "pointsAwarded": 50,
    "newBalance": 50,
    "date": "2025-10-10T12:30:00Z"
  },
  "message": "Transaction created successfully"
}
```

**Points Calculation:** Rs. 5000 ÷ 100 = 50 points

## Step 4: Retry Transaction (Idempotency Test)

```bash
# Use the SAME idempotency key - should return cached response
curl -X POST http://localhost:3000/api/integrations/transactions \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d '{
    "customerEmail": "jane.doe@example.com",
    "amount": 5000.00
  }'
```

**Result:** Returns the same response, no duplicate transaction created!

## Step 5: Check Customer Points

```bash
curl -X GET "http://localhost:3000/api/integrations/customers?email=jane.doe@example.com" \
  -H "x-api-key: $API_KEY"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "phone": "+1 (555) 999-8888",
      "points": 50
    }
  ],
  "count": 1
}
```

## Step 6: List Available Rewards

```bash
curl -X GET http://localhost:3000/api/integrations/rewards \
  -H "x-api-key: $API_KEY"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Free Coffee",
      "description": "Get a free medium coffee",
      "pointsRequired": 100
    },
    {
      "id": 2,
      "title": "20% Off",
      "description": "Get 20% off your next purchase",
      "pointsRequired": 200
    }
  ],
  "count": 2
}
```

## Step 7: Redeem Reward

```bash
curl -X POST http://localhost:3000/api/integrations/redemptions \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "Idempotency-Key: rdm_$(date +%s)" \
  -d '{
    "customerEmail": "jane.doe@example.com",
    "rewardId": 1
  }'
```

**Response (if customer has enough points):**
```json
{
  "success": true,
  "data": {
    "redemptionId": 5,
    "customerId": 3,
    "rewardId": 1,
    "rewardTitle": "Free Coffee",
    "pointsDeducted": 100,
    "newBalance": -50,
    "date": "2025-10-10T12:45:00Z"
  },
  "message": "Reward redeemed successfully"
}
```

**Response (insufficient points):**
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

## Step 8: Register Webhook

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
    "isActive": true,
    "createdAt": "2025-10-10T12:00:00Z"
  },
  "message": "Webhook registered successfully. Store the secret securely - it will not be shown again."
}
```

## Step 9: Receive Webhook and Verify Signature

When a webhook is triggered, you'll receive:

**Headers:**
- `X-Webhook-Signature`: HMAC SHA-256 signature
- `X-Webhook-Event`: Event type
- `Content-Type`: application/json

**Payload Example:**
```json
{
  "event": "points_awarded",
  "data": {
    "customerId": 3,
    "pointsAwarded": 50,
    "newBalance": 100,
    "reason": "transaction"
  },
  "businessId": 1,
  "timestamp": "2025-10-10T12:30:00Z"
}
```

**Verify Signature (Node.js):**
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

// Usage
const isValid = verifyWebhook(webhookPayload, signatureHeader, webhookSecret);
```

## Complete POS Flow Example

```bash
#!/bin/bash

# Configuration
export API_KEY="lx_your_api_key_here"
export BASE_URL="http://localhost:3000/api/integrations"

# 1. Create customer
echo "Creating customer..."
CUSTOMER_RESPONSE=$(curl -s -X POST $BASE_URL/customers \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "Idempotency-Key: cust_$(date +%s)" \
  -d '{
    "email": "test@example.com",
    "name": "Test Customer",
    "phone": "+1 (555) 000-0000"
  }')

echo $CUSTOMER_RESPONSE | jq '.'

# 2. Create transaction (Rs. 10000 = 100 points)
echo "Creating transaction..."
TXN_RESPONSE=$(curl -s -X POST $BASE_URL/transactions \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "Idempotency-Key: txn_$(date +%s)" \
  -d '{
    "customerEmail": "test@example.com",
    "amount": 10000.00
  }')

echo $TXN_RESPONSE | jq '.'

# 3. Check customer points
echo "Checking customer points..."
curl -s -X GET "$BASE_URL/customers?email=test@example.com" \
  -H "x-api-key: $API_KEY" | jq '.'

# 4. List rewards
echo "Listing rewards..."
curl -s -X GET $BASE_URL/rewards \
  -H "x-api-key: $API_KEY" | jq '.'

# 5. Redeem reward (if enough points)
echo "Redeeming reward..."
curl -s -X POST $BASE_URL/redemptions \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "Idempotency-Key: rdm_$(date +%s)" \
  -d '{
    "customerEmail": "test@example.com",
    "rewardId": 1
  }' | jq '.'

echo "POS flow completed!"
```

## Error Responses

### Unauthorized
```json
{
  "error": "Invalid API key"
}
```

### Missing Idempotency Key (Warning)
While not required, it's highly recommended to include idempotency keys for all write operations.

### Insufficient Points
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

## Best Practices

1. **Always use Idempotency-Key** for POST requests to prevent duplicate transactions
2. **Store API keys securely** - never commit them to version control
3. **Use HTTPS in production** - never send API keys over plain HTTP
4. **Verify webhook signatures** - always validate incoming webhook payloads
5. **Handle rate limits** - implement exponential backoff for retries
6. **Log all API interactions** - for debugging and audit trails

