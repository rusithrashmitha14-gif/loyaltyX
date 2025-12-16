import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateApiKey } from '@/lib/api-key-auth';
import { checkIdempotency, storeIdempotentResponse } from '@/lib/idempotency';
import { enqueueWebhook } from '@/lib/webhooks';

/**
 * POST /api/integrations/redemptions
 * Redeem a reward for a customer
 * Supports idempotency via Idempotency-Key header
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

    // Check idempotency
    const cachedResponse = await checkIdempotency(request, authResult.businessId!);
    if (cachedResponse) {
      return cachedResponse;
    }

    const body = await request.json();
    const { customerId, customerEmail, rewardId } = body;

    if (!rewardId || (!customerId && !customerEmail)) {
      return NextResponse.json(
        {
          error: 'Missing required fields: rewardId and (customerId or customerEmail)',
        },
        { status: 400 }
      );
    }

    // Find customer
    let customer;
    if (customerId) {
      customer = await prisma.customer.findFirst({
        where: {
          id: parseInt(customerId),
          businessId: authResult.businessId!,
        },
      });
    } else if (customerEmail) {
      customer = await prisma.customer.findFirst({
        where: {
          email: customerEmail,
          businessId: authResult.businessId!,
        },
      });
    }

    if (!customer) {
      return NextResponse.json(
        {
          error: 'Customer not found',
        },
        { status: 404 }
      );
    }

    // Get reward
    const reward = await prisma.reward.findFirst({
      where: {
        id: parseInt(rewardId),
        businessId: authResult.businessId!,
      },
    });

    if (!reward) {
      return NextResponse.json(
        {
          error: 'Reward not found',
        },
        { status: 404 }
      );
    }

    // Check if customer has enough points
    if (customer.points < reward.pointsRequired) {
      return NextResponse.json(
        {
          error: 'Insufficient points',
          details: {
            required: reward.pointsRequired,
            available: customer.points,
            shortage: reward.pointsRequired - customer.points,
          },
        },
        { status: 400 }
      );
    }

    // Create redemption and deduct points
    const result = await prisma.$transaction(async (tx) => {
      const redemption = await tx.redemption.create({
        data: {
          customerId: customer.id,
          rewardId: reward.id,
        },
      });

      const updatedCustomer = await tx.customer.update({
        where: { id: customer.id },
        data: {
          points: {
            decrement: reward.pointsRequired,
          },
        },
      });

      return { redemption, updatedCustomer };
    });

    const response = {
      success: true,
      data: {
        redemptionId: result.redemption.id,
        customerId: customer.id,
        rewardId: reward.id,
        rewardTitle: reward.title,
        pointsDeducted: reward.pointsRequired,
        newBalance: result.updatedCustomer.points,
        date: result.redemption.date,
      },
      message: 'Reward redeemed successfully',
    };

    // Enqueue webhook
    await enqueueWebhook(authResult.businessId!, 'redemption_completed', {
      redemptionId: result.redemption.id,
      customerId: customer.id,
      rewardId: reward.id,
      pointsDeducted: reward.pointsRequired,
      newBalance: result.updatedCustomer.points,
    });

    // Store idempotent response
    const idempotencyKey = request.headers.get('idempotency-key');
    if (idempotencyKey) {
      await storeIdempotentResponse(idempotencyKey, authResult.businessId!, {
        status: 201,
        body: response,
      });
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating redemption:', error);
    return NextResponse.json(
      {
        error: 'Failed to create redemption',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/redemptions
 * List redemptions for authenticated business
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

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereClause: any = {
      customer: {
        businessId: authResult.businessId!,
      },
    };

    if (customerId) {
      whereClause.customerId = parseInt(customerId);
    }

    const [redemptions, total] = await Promise.all([
      prisma.redemption.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              points: true,
            },
          },
          reward: {
            select: {
              id: true,
              title: true,
              description: true,
              pointsRequired: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.redemption.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      data: redemptions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching redemptions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch redemptions',
      },
      { status: 500 }
    );
  }
}

