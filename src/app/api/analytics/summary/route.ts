import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth-middleware';
import { calculatePoints } from '@/lib/points';

/**
 * GET /api/analytics/summary?range=30d
 * Returns KPI summary: points issued, redeemed, active customers, avg spend
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
    const range = searchParams.get('range') || '30d';

    // Calculate date range
    const days = parseInt(range.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const businessId = authResult.businessId!;

    // Get transactions in range
    const transactions = await prisma.transaction.findMany({
      where: {
        businessId,
        date: {
          gte: startDate,
        },
      },
      select: {
        amount: true,
        customerId: true,
      },
    });

    // Get redemptions in range
    const redemptions = await prisma.redemption.findMany({
      where: {
        customer: {
          businessId,
        },
        date: {
          gte: startDate,
        },
      },
      include: {
        reward: {
          select: {
            pointsRequired: true,
          },
        },
      },
    });

    // Calculate metrics
    const totalTransactions = transactions.length;
    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    const pointsIssued = transactions.reduce((sum, t) => sum + calculatePoints(t.amount), 0);
    const pointsRedeemed = redemptions.reduce((sum, r) => sum + r.reward.pointsRequired, 0);
    
    const uniqueCustomers = new Set(transactions.map(t => t.customerId)).size;
    const avgSpendPerVisit = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Get total customers
    const totalCustomers = await prisma.customer.count({
      where: { businessId },
    });

    // Get active customers (had transaction in range)
    const activeCustomers = uniqueCustomers;

    return NextResponse.json({
      success: true,
      data: {
        range,
        totalPointsIssued: pointsIssued,
        totalPointsRedeemed: pointsRedeemed,
        netPoints: pointsIssued - pointsRedeemed,
        activeCustomers,
        totalCustomers,
        totalTransactions,
        totalRevenue,
        avgSpendPerVisit,
        totalRedemptions: redemptions.length,
        redemptionRate: pointsIssued > 0 ? (pointsRedeemed / pointsIssued) * 100 : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics summary',
      },
      { status: 500 }
    );
  }
}

