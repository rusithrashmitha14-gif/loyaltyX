import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth-middleware';

/**
 * GET /api/analytics/at-risk-customers?inactive_days=60
 * Returns customers who haven't visited recently
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
    const inactiveDays = parseInt(searchParams.get('inactive_days') || '60');
    const limit = parseInt(searchParams.get('limit') || '50');

    const inactiveDate = new Date();
    inactiveDate.setDate(inactiveDate.getDate() - inactiveDays);

    const businessId = authResult.businessId!;

    // Get all customers with their last transaction
    const allCustomers = await prisma.customer.findMany({
      where: {
        businessId,
      },
      include: {
        transactions: {
          select: {
            amount: true,
            date: true,
          },
          orderBy: {
            date: 'desc',
          },
          take: 1,
        },
      },
    });

    // Filter customers who haven't visited since inactive date
    const atRiskCustomers = allCustomers
      .filter((customer) => {
        if (customer.transactions.length === 0) return true; // Never visited
        const lastVisit = customer.transactions[0].date;
        return lastVisit < inactiveDate;
      })
      .sort((a, b) => {
        const aDate = a.transactions[0]?.date || new Date(0);
        const bDate = b.transactions[0]?.date || new Date(0);
        return aDate.getTime() - bDate.getTime();
      })
      .slice(0, limit);

    const customerMetrics = atRiskCustomers.map((customer) => {
      const lastTransaction = customer.transactions[0];
      const lastVisitDate = lastTransaction?.date;
      const daysSinceLastVisit = lastVisitDate
        ? Math.floor((Date.now() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        points: customer.points,
        lastVisitAt: lastVisitDate,
        daysSinceLastVisit,
        lastTransactionAmount: lastTransaction?.amount || 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: customerMetrics,
      count: customerMetrics.length,
      inactiveDays,
    });
  } catch (error) {
    console.error('Error fetching at-risk customers:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch at-risk customers',
      },
      { status: 500 }
    );
  }
}

