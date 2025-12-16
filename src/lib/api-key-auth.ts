import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import crypto from 'crypto';

export interface ApiKeyAuthResult {
  success: boolean;
  businessId?: number;
  environment?: string;
  error?: string;
}

/**
 * Authenticate API request using x-api-key header
 */
export async function authenticateApiKey(request: NextRequest): Promise<ApiKeyAuthResult> {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return {
      success: false,
      error: 'Missing x-api-key header',
    };
  }

  try {
    const key = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { business: true },
    });

    if (!key) {
      return {
        success: false,
        error: 'Invalid API key',
      };
    }

    if (!key.isActive) {
      return {
        success: false,
        error: 'API key is inactive',
      };
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      success: true,
      businessId: key.businessId,
      environment: key.environment,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Authentication failed',
    };
  }
}

/**
 * Generate a new API key
 */
export function generateApiKey(): string {
  const prefix = 'lx_';
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `${prefix}${randomBytes}`;
}

/**
 * Generate HMAC secret for webhooks
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

