import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateApiKey } from '@/lib/api-key-auth';

/**
 * GET /api/integrations/rewards
 * List all rewards for the authenticated business
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

    const rewards = await prisma.reward.findMany({
      where: {
        businessId: authResult.businessId!,
      },
      select: {
        id: true,
        title: true,
        description: true,
        pointsRequired: true,
      },
      orderBy: {
        pointsRequired: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: rewards,
      count: rewards.length,
    });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch rewards',
      },
      { status: 500 }
    );
  }
}

