import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateApiKey, generateWebhookSecret } from '@/lib/api-key-auth';
import { authenticateRequest } from '@/lib/auth-middleware';

/**
 * POST /api/integrations/auth
 * Generate new API key for a business (requires business JWT auth)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate using existing JWT system
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        {
          status: 'error',
          error: authResult.error || 'Authentication failed',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, environment = 'production' } = body;

    if (!name) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Missing required field: name',
        },
        { status: 400 }
      );
    }

    if (!['production', 'sandbox'].includes(environment)) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Environment must be "production" or "sandbox"',
        },
        { status: 400 }
      );
    }

    // Generate new API key
    const apiKey = generateApiKey();

    const newKey = await prisma.apiKey.create({
      data: {
        key: apiKey,
        name,
        businessId: authResult.businessId!,
        environment,
      },
    });

    return NextResponse.json(
      {
        status: 'success',
        data: {
          id: newKey.id,
          name: newKey.name,
          key: apiKey,
          environment: newKey.environment,
          isActive: newKey.isActive,
          createdAt: newKey.createdAt,
        },
        message: 'API key generated successfully. Store this key securely - it will not be shown again.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error generating API key:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to generate API key',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/auth
 * List API keys for authenticated business (keys are masked)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        {
          status: 'error',
          error: authResult.error || 'Authentication failed',
        },
        { status: 401 }
      );
    }

    const keys = await prisma.apiKey.findMany({
      where: {
        businessId: authResult.businessId!,
      },
      select: {
        id: true,
        name: true,
        key: true,
        environment: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Mask API keys (show only first 10 and last 4 characters)
    const maskedKeys = keys.map((key) => ({
      ...key,
      key: `${key.key.substring(0, 10)}...${key.key.substring(key.key.length - 4)}`,
    }));

    return NextResponse.json({
      status: 'success',
      data: maskedKeys,
      count: maskedKeys.length,
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to fetch API keys',
      },
      { status: 500 }
    );
  }
}

