import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth-middleware';
import { calculatePoints } from '@/lib/points';

/**
 * GET /api/analytics/transactions-timeseries?range=30d&interval=day
 * Returns transactions over time for charts
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
    const interval = searchParams.get('interval') || 'day';

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
        date: true,
      },
      orderBy: {
        date: 'asc',
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
      orderBy: {
        date: 'asc',
      },
    });

    // Group by date
    const groupByDate = (date: Date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // Aggregate transactions by day
    const dailyData: Record<string, any> = {};

    // Initialize all days in range (including today)
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = groupByDate(date);
      dailyData[dateKey] = {
        date: dateKey,
        transactions: 0,
        revenue: 0,
        pointsIssued: 0,
        pointsRedeemed: 0,
        redemptions: 0,
      };
    }

    // Add transaction data
    transactions.forEach((txn) => {
      const dateKey = groupByDate(txn.date);
      if (dailyData[dateKey]) {
        dailyData[dateKey].transactions += 1;
        dailyData[dateKey].revenue += txn.amount;
        dailyData[dateKey].pointsIssued += calculatePoints(txn.amount);
      }
    });

    // Add redemption data
    redemptions.forEach((red) => {
      const dateKey = groupByDate(red.date);
      if (dailyData[dateKey]) {
        dailyData[dateKey].redemptions += 1;
        dailyData[dateKey].pointsRedeemed += red.reward.pointsRequired;
      }
    });

    // Convert to array and sort
    const timeseriesData = Object.values(dailyData).sort((a: any, b: any) => 
      a.date.localeCompare(b.date)
    );

    return NextResponse.json({
      success: true,
      data: timeseriesData,
      count: timeseriesData.length,
    });
  } catch (error) {
    console.error('Error fetching transactions timeseries:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch transactions timeseries',
      },
      { status: 500 }
    );
  }
}

