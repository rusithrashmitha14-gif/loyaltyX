import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth-middleware';

/**
 * GET /api/analytics/top-rewards?range=90d
 * Returns most redeemed rewards
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error || 'Authentication failed',
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '90d';
    const limit = parseInt(searchParams.get('limit') || '10');

    const days = parseInt(range.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const businessId = authResult.businessId!;

    // Get all rewards with redemption counts
    const rewards = await prisma.reward.findMany({
      where: {
        businessId,
      },
      include: {
        redemptions: {
          where: {
            date: {
              gte: startDate,
            },
          },
        },
      },
    });

    // Calculate metrics
    const rewardMetrics = rewards
      .map((reward) => ({
        id: reward.id,
        title: reward.title,
        description: reward.description,
        pointsRequired: reward.pointsRequired,
        redemptionCount: reward.redemptions.length,
        totalPointsUsed: reward.redemptions.length * reward.pointsRequired,
      }))
      .filter((r) => r.redemptionCount > 0) // Only include redeemed rewards
      .sort((a, b) => b.redemptionCount - a.redemptionCount)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: rewardMetrics,
      count: rewardMetrics.length,
    });
  } catch (error) {
    console.error('Error fetching top rewards:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch top rewards',
      },
      { status: 500 }
    );
  }
}

