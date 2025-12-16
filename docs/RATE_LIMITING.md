# 🚦 Rate Limiting Guide

Rate limiting protects your API from abuse, DDoS attacks, and excessive usage. This guide explains how to implement rate limiting in LoyaltyX.

---

## 🎯 Why Rate Limiting?

**Benefits:**
- **Security**: Prevent brute force attacks on login/signup
- **Stability**: Protect against accidental infinite loops or bugs
- **Fair Usage**: Ensure resources are distributed fairly among users
- **Cost Control**: Prevent unexpected database/API costs

**Without rate limiting, attackers could:**
- Try millions of password combinations
- Scrape your entire customer database
- Overload your database with requests
- Cause downtime for legitimate users

---

## 🏗️ Architecture

### Development (In-Memory)
- Simple in-memory storage
- ⚠️ **NOT** suitable for production
- Resets when app restarts
- Only works with single server instance

### Production (Upstash Redis)
- Distributed rate limiting across all Vercel instances
- Persistent across deployments
- Serverless-compatible
- Free tier: 10,000 requests/day

---

## 📦 Installation

### 1. Install Required Packages

```bash
npm install @upstash/ratelimit @upstash/redis
```

### 2. Create Upstash Account

1. Go to [upstash.com](https://upstash.com)
2. Sign up (free tier available)
3. Create a new Redis database:
   - Name: `loyaltyx-ratelimit`
   - Type: Regional (fastest)
   - Region: Same as your Vercel deployment

### 3. Get Credentials

1. Click on your database
2. Scroll to **REST API** section
3. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 4. Add Environment Variables

**Local (`.env`):**
```env
UPSTASH_REDIS_REST_URL="https://your-db.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_token_here"
```

**Production (Vercel):**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add both variables
3. Redeploy

---

## 🔧 Configuration

### Update Rate Limit Module

Edit `src/lib/rate-limit.ts` to enable Upstash:

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const ratelimit = new Ratelimit({
  redis: new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  }),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  prefix: "loyaltyx:ratelimit",
});
```

---

## 🎨 Usage Examples

### Example 1: Protect Login Endpoint

```typescript
// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { rateLimitByIP } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Apply strict rate limiting (3 attempts per minute)
  if (await rateLimitByIP(req, true)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again in 1 minute." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  // ... rest of login logic
}
```

### Example 2: Protect API Key Routes

```typescript
// src/app/api/integrations/transactions/route.ts
import { NextResponse } from "next/server";
import { rateLimitByIdentifier } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  
  if (!apiKey) {
    return NextResponse.json({ error: "API key required" }, { status: 401 });
  }

  // Rate limit per API key (1000 requests per hour)
  if (await rateLimitByIdentifier(`apikey:${apiKey}`)) {
    return NextResponse.json(
      { 
        error: "Rate limit exceeded for this API key",
        limit: 1000,
        window: "1 hour"
      },
      { status: 429 }
    );
  }

  // ... rest of integration logic
}
```

### Example 3: Protect Public Endpoints

```typescript
// src/app/api/customers/route.ts
import { NextResponse } from "next/server";
import { rateLimitByIP } from "@/lib/rate-limit";

export async function GET(req: Request) {
  // Standard rate limiting (10 requests per 10 seconds)
  if (await rateLimitByIP(req)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }

  // ... rest of endpoint logic
}
```

---

## ⚙️ Rate Limit Tiers

Recommended limits for different endpoint types:

| Endpoint Type | Requests | Window | Use Case |
|---------------|----------|--------|----------|
| **Public Unauthenticated** | 10 | 10 seconds | Homepage, documentation |
| **Authentication** | 5 | 15 minutes | Login, signup, password reset |
| **Standard API** | 100 | 1 minute | Authenticated user operations |
| **Integration API** | 1000 | 1 hour | External POS systems |
| **Admin Operations** | 50 | 1 minute | Admin dashboard actions |
| **File Uploads** | 5 | 1 hour | Image/document uploads |

### Custom Configuration

```typescript
// src/lib/rate-limit.ts
export const customRatelimit = new Ratelimit({
  redis: new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  }),
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 per minute
  analytics: true,
  prefix: "loyaltyx:custom",
});
```

---

## 🧪 Testing Rate Limits

### Manual Testing

```bash
# Test login rate limit (should block after 5 attempts)
for i in {1..10}; do
  curl -X POST https://loyaltyx.vercel.app/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n\n"
  sleep 1
done
```

### Automated Testing

```typescript
// tests/rate-limit.test.ts
import { rateLimitByIP } from "@/lib/rate-limit";

describe("Rate Limiting", () => {
  it("should block after 10 requests", async () => {
    const mockReq = new Request("http://localhost:3000/api/test", {
      headers: { "x-forwarded-for": "192.168.1.1" }
    });

    // First 10 should succeed
    for (let i = 0; i < 10; i++) {
      const limited = await rateLimitByIP(mockReq);
      expect(limited).toBe(false);
    }

    // 11th should be rate limited
    const limited = await rateLimitByIP(mockReq);
    expect(limited).toBe(true);
  });
});
```

---

## 📊 Monitoring

### View Analytics in Upstash

1. Go to Upstash Dashboard
2. Click on your database
3. Navigate to **Analytics** tab
4. View:
   - Request count per endpoint
   - Rate limit hits
   - Geographic distribution

### Log Rate Limit Events

```typescript
// src/lib/rate-limit.ts
export async function rateLimitByIP(
  req: Request, 
  strict: boolean = false
): Promise<boolean> {
  const ip = getClientIP(req);
  const limiter = strict ? strictRatelimit : ratelimit;
  
  const { success, limit, remaining } = await limiter.limit(ip);
  
  if (!success) {
    console.warn(`Rate limit exceeded for IP ${ip}`, {
      endpoint: req.url,
      limit,
      remaining,
      timestamp: new Date().toISOString(),
    });
  }
  
  return !success;
}
```

---

## 🚨 Error Handling

### User-Friendly Responses

```typescript
if (await rateLimitByIP(req)) {
  return NextResponse.json(
    { 
      error: "Too many requests",
      message: "You've made too many requests. Please try again in 1 minute.",
      retryAfter: 60,
      code: "RATE_LIMIT_EXCEEDED"
    },
    { 
      status: 429,
      headers: {
        "Retry-After": "60",
        "X-RateLimit-Limit": "10",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Date.now() + 60000),
      }
    }
  );
}
```

### Client-Side Handling

```typescript
// Frontend code
async function makeRequest() {
  const response = await fetch("/api/endpoint", { method: "POST" });
  
  if (response.status === 429) {
    const data = await response.json();
    const retryAfter = response.headers.get("Retry-After");
    
    alert(`Rate limit exceeded. Please wait ${retryAfter} seconds.`);
    
    // Automatically retry after delay
    setTimeout(() => makeRequest(), parseInt(retryAfter) * 1000);
    return;
  }
  
  // ... handle success
}
```

---

## 🔐 Security Best Practices

### 1. Use Different Identifiers

```typescript
// Rate limit by IP for anonymous users
await rateLimitByIP(req);

// Rate limit by user ID for authenticated users
await rateLimitByIdentifier(`user:${userId}`);

// Rate limit by API key for integrations
await rateLimitByIdentifier(`apikey:${apiKey}`);
```

### 2. Combine Multiple Limits

```typescript
export async function POST(req: Request) {
  // Global IP limit (prevent DDoS)
  if (await rateLimitByIP(req)) {
    return new Response("Too many requests", { status: 429 });
  }
  
  const userId = await getUserId(req);
  
  // Per-user limit (prevent abuse)
  if (await rateLimitByIdentifier(`user:${userId}`)) {
    return new Response("User rate limit exceeded", { status: 429 });
  }
  
  // ... process request
}
```

### 3. Whitelist Trusted IPs

```typescript
const TRUSTED_IPS = ["1.2.3.4", "5.6.7.8"];

export async function rateLimitByIP(req: Request): Promise<boolean> {
  const ip = getClientIP(req);
  
  if (TRUSTED_IPS.includes(ip)) {
    return false; // Skip rate limiting for trusted IPs
  }
  
  // ... normal rate limit logic
}
```

---

## 📈 Scaling Considerations

### Upstash Pricing

| Plan | Requests/Day | Monthly Cost |
|------|--------------|--------------|
| Free | 10,000 | $0 |
| Pay-as-you-go | 100K | ~$5 |
| Pay-as-you-go | 1M | ~$50 |
| Pay-as-you-go | 10M | ~$500 |

### Alternative Solutions

If Upstash becomes too expensive:

1. **Vercel Edge Config** (included with Pro plan)
2. **CloudFlare Rate Limiting** (10,000 rules/month free)
3. **Self-hosted Redis** (on Railway, Render, etc.)
4. **Vercel WAF** (Enterprise plan)

---

## 🐛 Troubleshooting

### Issue: Rate limits not working

**Check:**
1. Environment variables set correctly
2. Packages installed (`@upstash/ratelimit`, `@upstash/redis`)
3. Upstash database is active
4. Using production build (`npm run build && npm start`)

### Issue: Users rate limited immediately

**Check:**
1. IP detection working correctly (check `x-forwarded-for` header)
2. Multiple users not sharing same IP (corporate network, NAT)
3. Rate limit window not too restrictive

### Issue: Rate limits not resetting

**Check:**
1. Sliding window vs fixed window configuration
2. Redis connection is stable
3. System time is correct (rate limits use timestamps)

---

## 📚 Additional Resources

- [Upstash Rate Limiting Docs](https://upstash.com/docs/redis/features/ratelimiting)
- [Vercel Rate Limiting Guide](https://vercel.com/docs/edge-network/rate-limiting)
- [OWASP Rate Limiting Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)

---

**Last Updated:** October 2025  
**Maintained By:** LoyaltyX Team




