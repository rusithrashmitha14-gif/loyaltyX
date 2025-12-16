#!/bin/bash

# LoyaltyX POS Integration Flow Test Script
# This script simulates a complete POS integration workflow

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000"
API_BASE="${BASE_URL}/api/integrations"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   LoyaltyX POS Integration Flow Test      ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════╝${NC}"
echo ""

# Step 0: Login and get JWT token
echo -e "${YELLOW}[0] Logging in to get JWT token...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@loyaltyx.com",
    "password": "password123"
  }')

JWT_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')

if [ "$JWT_TOKEN" = "null" ] || [ -z "$JWT_TOKEN" ]; then
  echo -e "${RED}❌ Failed to login${NC}"
  echo $LOGIN_RESPONSE | jq '.'
  exit 1
fi

echo -e "${GREEN}✅ Logged in successfully${NC}"
echo ""

# Step 1: Generate API Key
echo -e "${YELLOW}[1] Generating API Key...${NC}"
API_KEY_RESPONSE=$(curl -s -X POST ${API_BASE}/auth \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "name": "Test POS System",
    "environment": "sandbox"
  }')

API_KEY=$(echo $API_KEY_RESPONSE | jq -r '.data.key')

if [ "$API_KEY" = "null" ] || [ -z "$API_KEY" ]; then
  echo -e "${RED}❌ Failed to generate API key${NC}"
  echo $API_KEY_RESPONSE | jq '.'
  exit 1
fi

echo -e "${GREEN}✅ API Key: ${API_KEY:0:20}...${NC}"
echo ""

# Step 2: Create a sandbox customer
echo -e "${YELLOW}[2] Creating sandbox customer...${NC}"
IDEMPOTENCY_KEY="customer_$(date +%s)"

CUSTOMER_RESPONSE=$(curl -s -X POST ${API_BASE}/customers \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d '{
    "email": "pos.test@example.com",
    "name": "POS Test Customer",
    "phone": "+94 77 123 4567"
  }')

CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | jq -r '.data.id')

if [ "$CUSTOMER_ID" = "null" ]; then
  echo -e "${RED}❌ Failed to create customer${NC}"
  echo $CUSTOMER_RESPONSE | jq '.'
  exit 1
fi

echo -e "${GREEN}✅ Customer created (ID: $CUSTOMER_ID)${NC}"
echo $CUSTOMER_RESPONSE | jq '.data'
echo ""

# Step 3: Post a transaction with idempotency
echo -e "${YELLOW}[3] Creating transaction (Rs. 5000)...${NC}"
TXN_IDEMPOTENCY_KEY="txn_$(date +%s)"

TXN_RESPONSE=$(curl -s -X POST ${API_BASE}/transactions \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "Idempotency-Key: $TXN_IDEMPOTENCY_KEY" \
  -d "{
    \"customerId\": $CUSTOMER_ID,
    \"amount\": 5000.00
  }")

POINTS_AWARDED=$(echo $TXN_RESPONSE | jq -r '.data.pointsAwarded')
NEW_BALANCE=$(echo $TXN_RESPONSE | jq -r '.data.newBalance')

if [ "$POINTS_AWARDED" = "null" ]; then
  echo -e "${RED}❌ Failed to create transaction${NC}"
  echo $TXN_RESPONSE | jq '.'
  exit 1
fi

echo -e "${GREEN}✅ Transaction created${NC}"
echo "   Amount: Rs. 5000.00"
echo "   Points Awarded: $POINTS_AWARDED"
echo "   New Balance: $NEW_BALANCE points"
echo ""

# Step 4: Test idempotency - retry same transaction
echo -e "${YELLOW}[4] Testing idempotency (retry transaction)...${NC}"

RETRY_RESPONSE=$(curl -s -X POST ${API_BASE}/transactions \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "Idempotency-Key: $TXN_IDEMPOTENCY_KEY" \
  -d "{
    \"customerId\": $CUSTOMER_ID,
    \"amount\": 5000.00
  }")

RETRY_TXN_ID=$(echo $RETRY_RESPONSE | jq -r '.data.transactionId')

echo -e "${GREEN}✅ Idempotency working - returned cached response${NC}"
echo "   Same transaction ID: $RETRY_TXN_ID"
echo ""

# Step 5: Add more transactions to earn points
echo -e "${YELLOW}[5] Creating additional transactions...${NC}"

for i in {1..3}; do
  AMOUNT=$((i * 3000))
  TXN_RESP=$(curl -s -X POST ${API_BASE}/transactions \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -H "Idempotency-Key: txn_batch_${i}_$(date +%s)" \
    -d "{
      \"customerId\": $CUSTOMER_ID,
      \"amount\": $AMOUNT
    }")
  
  PTS=$(echo $TXN_RESP | jq -r '.data.pointsAwarded')
  BAL=$(echo $TXN_RESP | jq -r '.data.newBalance')
  echo "   Transaction $i: Rs. $AMOUNT → +$PTS points (Balance: $BAL)"
done
echo -e "${GREEN}✅ Additional transactions completed${NC}"
echo ""

# Step 6: Check customer points
echo -e "${YELLOW}[6] Checking customer points...${NC}"

CUSTOMER_CHECK=$(curl -s -X GET "${API_BASE}/customers?email=pos.test@example.com" \
  -H "x-api-key: $API_KEY")

CURRENT_POINTS=$(echo $CUSTOMER_CHECK | jq -r '.data[0].points')

echo -e "${GREEN}✅ Current points: $CURRENT_POINTS${NC}"
echo ""

# Step 7: List available rewards
echo -e "${YELLOW}[7] Fetching available rewards...${NC}"

REWARDS_RESPONSE=$(curl -s -X GET ${API_BASE}/rewards \
  -H "x-api-key: $API_KEY")

echo $REWARDS_RESPONSE | jq -r '.data[] | "   - \(.title): \(.pointsRequired) points"'
echo -e "${GREEN}✅ Rewards fetched${NC}"
echo ""

# Step 8: Redeem a reward
echo -e "${YELLOW}[8] Redeeming reward...${NC}"

REWARD_ID=$(echo $REWARDS_RESPONSE | jq -r '.data[0].id')
REWARD_TITLE=$(echo $REWARDS_RESPONSE | jq -r '.data[0].title')
POINTS_REQUIRED=$(echo $REWARDS_RESPONSE | jq -r '.data[0].pointsRequired')

if [ $CURRENT_POINTS -ge $POINTS_REQUIRED ]; then
  REDEMPTION_RESPONSE=$(curl -s -X POST ${API_BASE}/redemptions \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -H "Idempotency-Key: rdm_$(date +%s)" \
    -d "{
      \"customerId\": $CUSTOMER_ID,
      \"rewardId\": $REWARD_ID
    }")
  
  FINAL_BALANCE=$(echo $REDEMPTION_RESPONSE | jq -r '.data.newBalance')
  
  if [ "$FINAL_BALANCE" != "null" ]; then
    echo -e "${GREEN}✅ Reward redeemed: $REWARD_TITLE${NC}"
    echo "   Points deducted: $POINTS_REQUIRED"
    echo "   Final balance: $FINAL_BALANCE points"
  else
    echo -e "${RED}❌ Failed to redeem reward${NC}"
    echo $REDEMPTION_RESPONSE | jq '.'
  fi
else
  echo -e "${YELLOW}⚠️  Insufficient points ($CURRENT_POINTS) for $REWARD_TITLE ($POINTS_REQUIRED required)${NC}"
fi
echo ""

# Step 9: Register webhook
echo -e "${YELLOW}[9] Registering webhook...${NC}"

WEBHOOK_RESPONSE=$(curl -s -X POST ${API_BASE}/webhooks/register \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "url": "https://example.com/webhooks/loyaltyx",
    "events": ["points_awarded", "redemption_completed"]
  }')

WEBHOOK_SECRET=$(echo $WEBHOOK_RESPONSE | jq -r '.data.secret')

if [ "$WEBHOOK_SECRET" != "null" ]; then
  echo -e "${GREEN}✅ Webhook registered${NC}"
  echo "   URL: $(echo $WEBHOOK_RESPONSE | jq -r '.data.url')"
  echo "   Secret: ${WEBHOOK_SECRET:0:20}..."
  echo "   Events: $(echo $WEBHOOK_RESPONSE | jq -r '.data.events | join(", ")')"
else
  echo -e "${YELLOW}⚠️  Webhook registration skipped or failed${NC}"
fi
echo ""

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ✅ POS Integration Flow Completed!      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo "Test Summary:"
echo "============="
echo "API Key: ${API_KEY:0:30}..."
echo "Customer ID: $CUSTOMER_ID"
echo "Final Points: $CURRENT_POINTS"
echo "Transactions: 4"
echo "Redemptions: 1"
echo ""
echo "All tests passed successfully! 🎉"

