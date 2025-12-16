/**
 * Rate Limiting Utilities for LoyaltyX
 * 
 * This module provides rate limiting functionality using Upstash Redis.
 * 
 * Setup Instructions:
 * 1. Create an account at https://upstash.com
 * 2. Create a Redis database (free tier available)
 * 3. Copy the REST URL and token
 * 4. Add to .env:
 *    UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
 *    UPSTASH_REDIS_REST_TOKEN="your_token_here"
 * 5. Install dependencies:
 *    npm install @upstash/ratelimit @upstash/redis
 * 
 * Usage Example:
 * ```typescript
 * import { ratelimit, rateLimitByIP } from "@/lib/rate-limit";
 * 
 * export async function POST(req: Request) {
 *   const limited = await rateLimitByIP(req);
 *   if (limited) {
 *     return NextResponse.json(
 *       { error: "Too many requests. Please try again later." },
 *       { status: 429 }
 *     );
 *   }
 *   // ... rest of your handler
 * }
 * ```
 */

// Uncomment these imports after installing @upstash/ratelimit and @upstash/redis
// import { Ratelimit } from "@upstash/ratelimit";
// import { Redis } from "@upstash/redis";

/**
 * Simple in-memory rate limiter (fallback when Redis not configured)
 * NOTE: This is NOT suitable for production with multiple instances
 * Use Upstash Redis for production deployments
 */
class InMemoryRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(maxRequests: number, windowSeconds: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowSeconds * 1000;
  }

  async limit(identifier: string): Promise<{ success: boolean; remaining: number }> {
    const now = Date.now();
    const timestamps = this.requests.get(identifier) || [];
    
    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter(ts => now - ts < this.windowMs);
    
    if (validTimestamps.length >= this.maxRequests) {
      this.requests.set(identifier, validTimestamps);
      return { success: false, remaining: 0 };
    }
    
    validTimestamps.push(now);
    this.requests.set(identifier, validTimestamps);
    
    return { 
      success: true, 
      remaining: this.maxRequests - validTimestamps.length 
    };
  }

  async reset(identifier: string): Promise<void> {
    this.requests.delete(identifier);
  }
}

// Configuration
const RATE_LIMIT_ENABLED = process.env.NODE_ENV === 'production';
const UPSTASH_CONFIGURED = 
  process.env.UPSTASH_REDIS_REST_URL && 
  process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Main rate limiter instance
 * 
 * Production: Uses Upstash Redis (distributed, multi-instance safe)
 * Development: Uses in-memory fallback (single instance only)
 */
export const ratelimit = UPSTASH_CONFIGURED 
  ? null // Replace with actual Upstash instance after installing packages
  /*
  new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    }),
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    analytics: true,
    prefix: "loyaltyx:ratelimit",
  })
  */
  : new InMemoryRateLimiter(10, 10);

/**
 * Strict rate limiter for sensitive operations
 * Example: Authentication, password reset, API key generation
 */
export const strictRatelimit = UPSTASH_CONFIGURED
  ? null // Replace with actual Upstash instance
  /*
  new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    }),
    limiter: Ratelimit.slidingWindow(3, "60 s"),
    analytics: true,
    prefix: "loyaltyx:strict",
  })
  */
  : new InMemoryRateLimiter(3, 60);

/**
 * Get client IP address from request
 * Works with Vercel, Cloudflare, and other proxies
 */
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIP = req.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return "unknown";
}

/**
 * Helper function to rate limit by IP address
 * 
 * @param req - The incoming request
 * @param strict - Use strict rate limit (fewer requests allowed)
 * @returns true if rate limited (should reject), false if allowed
 */
export async function rateLimitByIP(
  req: Request, 
  strict: boolean = false
): Promise<boolean> {
  if (!RATE_LIMIT_ENABLED) {
    return false; // Disabled in development
  }

  const ip = getClientIP(req);
  const limiter = strict ? strictRatelimit : ratelimit;
  
  if (!limiter) {
    console.warn("Rate limiter not configured. Install @upstash/ratelimit for production.");
    return false;
  }

  const { success } = await limiter.limit(ip);
  return !success;
}

/**
 * Helper function to rate limit by custom identifier
 * Useful for per-user or per-API-key rate limiting
 * 
 * @param identifier - Unique identifier (user ID, API key, etc.)
 * @param strict - Use strict rate limit
 * @returns true if rate limited (should reject), false if allowed
 */
export async function rateLimitByIdentifier(
  identifier: string,
  strict: boolean = false
): Promise<boolean> {
  if (!RATE_LIMIT_ENABLED) {
    return false;
  }

  const limiter = strict ? strictRatelimit : ratelimit;
  
  if (!limiter) {
    return false;
  }

  const { success } = await limiter.limit(identifier);
  return !success;
}

/**
 * Rate limit configuration presets
 */
export const RATE_LIMITS = {
  // Public endpoints (unauthenticated)
  PUBLIC: { requests: 10, window: "10 s" },
  
  // Authentication endpoints
  AUTH: { requests: 5, window: "15 m" },
  
  // Authenticated API endpoints
  API: { requests: 100, window: "1 m" },
  
  // Integration API (external POS systems)
  INTEGRATION: { requests: 1000, window: "1 h" },
  
  // Admin operations
  ADMIN: { requests: 50, window: "1 m" },
} as const;

/**
 * Example usage in an API route:
 * 
 * ```typescript
 * // src/app/api/auth/login/route.ts
 * import { rateLimitByIP } from "@/lib/rate-limit";
 * 
 * export async function POST(req: Request) {
 *   // Apply strict rate limiting to login attempts
 *   if (await rateLimitByIP(req, true)) {
 *     return NextResponse.json(
 *       { error: "Too many login attempts. Please try again in 1 minute." },
 *       { status: 429 }
 *     );
 *   }
 * 
 *   // ... rest of login logic
 * }
 * ```
 * 
 * ```typescript
 * // src/app/api/integrations/transactions/route.ts
 * import { rateLimitByIdentifier } from "@/lib/rate-limit";
 * 
 * export async function POST(req: Request) {
 *   const apiKey = req.headers.get("x-api-key");
 *   
 *   // Rate limit by API key
 *   if (await rateLimitByIdentifier(`apikey:${apiKey}`)) {
 *     return NextResponse.json(
 *       { error: "Rate limit exceeded for this API key" },
 *       { status: 429 }
 *     );
 *   }
 * 
 *   // ... rest of integration logic
 * }
 * ```
 */




