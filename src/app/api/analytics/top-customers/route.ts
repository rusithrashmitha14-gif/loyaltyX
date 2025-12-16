import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth-middleware';

/**
 * GET /api/analytics/top-customers?range=30d&limit=10
 * Returns top customers by spend and points
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
    const limit = parseInt(searchParams.get('limit') || '10');

    const days = parseInt(range.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const businessId = authResult.businessId!;

    // Get customers with their transaction totals
    const customers = await prisma.customer.findMany({
      where: {
        businessId,
      },
      include: {
        transactions: {
          where: {
            date: {
              gte: startDate,
            },
          },
          select: {
            amount: true,
            date: true,
          },
        },
      },
    });

    // Calculate metrics for each customer
    const customerMetrics = customers
      .map((customer) => {
        const totalSpend = customer.transactions.reduce((sum, t) => sum + t.amount, 0);
        const transactionCount = customer.transactions.length;
        
        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          points: customer.points,
          totalSpend,
          transactionCount,
          avgSpend: transactionCount > 0 ? totalSpend / transactionCount : 0,
          lastVisit: customer.transactions.length > 0 ? customer.transactions[0].date : null,
        };
      })
      .filter((c) => c.totalSpend > 0) // Only include customers with transactions in range
      .sort((a, b) => b.totalSpend - a.totalSpend) // Sort by total spend descending
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: customerMetrics,
      count: customerMetrics.length,
    });
  } catch (error) {
    console.error('Error fetching top customers:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch top customers',
      },
      { status: 500 }
    );
  }
}

