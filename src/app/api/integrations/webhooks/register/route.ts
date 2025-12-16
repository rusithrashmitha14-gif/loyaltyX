import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateApiKey, generateWebhookSecret } from '@/lib/api-key-auth';

/**
 * POST /api/integrations/webhooks/register
 * Register a webhook URL for receiving events
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error,
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url, events = ['*'] } = body;

    if (!url) {
      return NextResponse.json(
        {
          error: 'Missing required field: url',
        },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        {
          error: 'Invalid URL format',
        },
        { status: 400 }
      );
    }

    // Validate events
    const validEvents = [
      '*',
      'points_awarded',
      'redemption_completed',
      'customer_created',
      'transaction_created',
    ];

    for (const event of events) {
      if (!validEvents.includes(event)) {
        return NextResponse.json(
          {
            error: `Invalid event type: ${event}. Valid events: ${validEvents.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    // Generate webhook secret
    const secret = generateWebhookSecret();

    const webhook = await prisma.webhook.create({
      data: {
        businessId: authResult.businessId!,
        url,
        events: JSON.stringify(events),
        secret,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: webhook.id,
          url: webhook.url,
          events,
          secret, // Return secret once for client to store
          isActive: webhook.isActive,
          createdAt: webhook.createdAt,
        },
        message:
          'Webhook registered successfully. Store the secret securely - it will not be shown again.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error registering webhook:', error);
    return NextResponse.json(
      {
        error: 'Failed to register webhook',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/webhooks/register
 * List webhooks for authenticated business
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error,
        },
        { status: 401 }
      );
    }

    const webhooks = await prisma.webhook.findMany({
      where: {
        businessId: authResult.businessId!,
      },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: webhooks.map((wh) => ({
        ...wh,
        events: JSON.parse(wh.events),
      })),
      count: webhooks.length,
    });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch webhooks',
      },
      { status: 500 }
    );
  }
}

