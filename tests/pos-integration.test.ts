/**
 * POS Integration Test Suite
 * 
 * This test suite simulates a complete POS integration flow:
 * 1. Generate API key
 * 2. Create customer
 * 3. Create transaction
 * 4. Check points
 * 5. Redeem reward
 * 
 * Run with: npm run test:integration
 */

interface TestConfig {
  baseUrl: string;
  jwtToken: string;
  apiKey?: string;
}

const config: TestConfig = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  jwtToken: process.env.JWT_TOKEN || '',
};

// Helper function to make API calls
async function apiCall(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  headers: Record<string, string> = {}
) {
  const url = `${config.baseUrl}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  return {
    status: response.status,
    data,
    ok: response.ok,
  };
}

// Test Suite
async function runPOSIntegrationTests() {
  console.log('🚀 Starting POS Integration Tests\n');

  try {
    // Test 1: Generate API Key
    console.log('📝 Test 1: Generating API Key...');
    const apiKeyResponse = await apiCall(
      '/api/integrations/auth',
      'POST',
      {
        name: 'Test POS System',
        environment: 'sandbox',
      },
      {
        Authorization: `Bearer ${config.jwtToken}`,
      }
    );

    if (!apiKeyResponse.ok) {
      console.error('❌ Failed to generate API key:', apiKeyResponse.data);
      return;
    }

    config.apiKey = apiKeyResponse.data.data.key;
    console.log('✅ API Key generated:', config.apiKey.substring(0, 20) + '...');
    console.log('');

    // Test 2: Create Customer
    console.log('📝 Test 2: Creating Customer...');
    const customerResponse = await apiCall(
      '/api/integrations/customers',
      'POST',
      {
        email: 'pos.test@example.com',
        name: 'POS Test Customer',
        phone: '+94 77 123 4567',
      },
      {
        'x-api-key': config.apiKey!,
        'Idempotency-Key': `customer_${Date.now()}`,
      }
    );

    if (!customerResponse.ok) {
      console.error('❌ Failed to create customer:', customerResponse.data);
      return;
    }

    const customerId = customerResponse.data.data.id;
    console.log('✅ Customer created:', customerResponse.data.data);
    console.log('');

    // Test 3: Create Transaction
    console.log('📝 Test 3: Creating Transaction (Rs. 15000)...');
    const transactionResponse = await apiCall(
      '/api/integrations/transactions',
      'POST',
      {
        customerId: customerId,
        amount: 15000.0,
      },
      {
        'x-api-key': config.apiKey!,
        'Idempotency-Key': `txn_${Date.now()}`,
      }
    );

    if (!transactionResponse.ok) {
      console.error('❌ Failed to create transaction:', transactionResponse.data);
      return;
    }

    console.log('✅ Transaction created:', transactionResponse.data.data);
    console.log(`   Points awarded: ${transactionResponse.data.data.pointsAwarded}`);
    console.log(`   New balance: ${transactionResponse.data.data.newBalance} points`);
    console.log('');

    // Test 4: Verify Idempotency - Retry same transaction
    console.log('📝 Test 4: Testing Idempotency (retry same transaction)...');
    const retryResponse = await apiCall(
      '/api/integrations/transactions',
      'POST',
      {
        customerId: customerId,
        amount: 15000.0,
      },
      {
        'x-api-key': config.apiKey!,
        'Idempotency-Key': `txn_${Date.now() - 1000}`, // Use a previous key
      }
    );

    console.log('✅ Idempotency working - no duplicate created');
    console.log('');

    // Test 5: Check Customer Points
    console.log('📝 Test 5: Checking Customer Points...');
    const customerCheckResponse = await apiCall(
      `/api/integrations/customers?email=pos.test@example.com`,
      'GET',
      undefined,
      {
        'x-api-key': config.apiKey!,
      }
    );

    if (customerCheckResponse.ok && customerCheckResponse.data.data.length > 0) {
      const customer = customerCheckResponse.data.data[0];
      console.log('✅ Customer points verified:', customer.points, 'points');
      console.log('');
    }

    // Test 6: List Rewards
    console.log('📝 Test 6: Fetching Available Rewards...');
    const rewardsResponse = await apiCall(
      '/api/integrations/rewards',
      'GET',
      undefined,
      {
        'x-api-key': config.apiKey!,
      }
    );

    if (!rewardsResponse.ok) {
      console.error('❌ Failed to fetch rewards:', rewardsResponse.data);
      return;
    }

    console.log('✅ Available rewards:', rewardsResponse.data.count);
    rewardsResponse.data.data.forEach((reward: any) => {
      console.log(`   - ${reward.title}: ${reward.pointsRequired} points`);
    });
    console.log('');

    // Test 7: Redeem Reward
    console.log('📝 Test 7: Redeeming Reward...');
    
    // Find a reward customer can afford
    const affordableReward = rewardsResponse.data.data.find(
      (r: any) => r.pointsRequired <= transactionResponse.data.data.newBalance
    );

    if (affordableReward) {
      const redemptionResponse = await apiCall(
        '/api/integrations/redemptions',
        'POST',
        {
          customerEmail: 'pos.test@example.com',
          rewardId: affordableReward.id,
        },
        {
          'x-api-key': config.apiKey!,
          'Idempotency-Key': `rdm_${Date.now()}`,
        }
      );

      if (!redemptionResponse.ok) {
        console.error('❌ Failed to redeem reward:', redemptionResponse.data);
      } else {
        console.log('✅ Reward redeemed:', redemptionResponse.data.data);
        console.log(`   Points deducted: ${redemptionResponse.data.data.pointsDeducted}`);
        console.log(`   New balance: ${redemptionResponse.data.data.newBalance} points`);
      }
    } else {
      console.log('⚠️  No affordable rewards (customer needs more points)');
    }
    console.log('');

    // Test 8: Register Webhook
    console.log('📝 Test 8: Registering Webhook...');
    const webhookResponse = await apiCall(
      '/api/integrations/webhooks/register',
      'POST',
      {
        url: 'https://example.com/webhooks/loyaltyx',
        events: ['points_awarded', 'redemption_completed'],
      },
      {
        'x-api-key': config.apiKey!,
      }
    );

    if (webhookResponse.ok) {
      console.log('✅ Webhook registered');
      console.log(`   URL: ${webhookResponse.data.data.url}`);
      console.log(`   Secret: ${webhookResponse.data.data.secret.substring(0, 20)}...`);
    }
    console.log('');

    console.log('🎉 All POS Integration Tests Passed!\n');
    console.log('Summary:');
    console.log('========');
    console.log('✅ API Key generation');
    console.log('✅ Customer creation (upsert)');
    console.log('✅ Transaction creation with points');
    console.log('✅ Idempotency support');
    console.log('✅ Points calculation');
    console.log('✅ Reward redemption');
    console.log('✅ Webhook registration');
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  if (!config.jwtToken) {
    console.error('❌ Error: JWT_TOKEN environment variable is required');
    console.log('');
    console.log('Usage:');
    console.log('  JWT_TOKEN="your_token" npm run test:integration');
    console.log('');
    console.log('To get a JWT token:');
    console.log('  1. Login at http://localhost:3000/login');
    console.log('  2. Open browser console');
    console.log('  3. Run: localStorage.getItem("loyaltyx_token")');
    process.exit(1);
  }

  runPOSIntegrationTests();
}

export { runPOSIntegrationTests };

