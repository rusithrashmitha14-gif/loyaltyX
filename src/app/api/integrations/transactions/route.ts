import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateApiKey } from '@/lib/api-key-auth';
import { checkIdempotency, storeIdempotentResponse } from '@/lib/idempotency';
import { calculatePoints } from '@/lib/points';
import { enqueueWebhook } from '@/lib/webhooks';

/**
 * POST /api/integrations/transactions
 * Create a new transaction and award points
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
    const { customerId, customerEmail, amount, date } = body;

    if (!amount || (!customerId && !customerEmail)) {
      return NextResponse.json(
        {
          error: 'Missing required fields: amount and (customerId or customerEmail)',
        },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        {
          error: 'Amount must be greater than 0',
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

    // Calculate points
    const pointsAwarded = calculatePoints(amount);

    // Create transaction and update customer points in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          amount: parseFloat(amount),
          date: date ? new Date(date) : new Date(),
          customerId: customer.id,
          businessId: authResult.businessId!,
        },
      });

      // Update customer points
      const updatedCustomer = await tx.customer.update({
        where: { id: customer.id },
        data: {
          points: {
            increment: pointsAwarded,
          },
        },
      });

      return { transaction, updatedCustomer };
    });

    const response = {
      success: true,
      data: {
        transactionId: result.transaction.id,
        customerId: customer.id,
        amount: result.transaction.amount,
        pointsAwarded,
        newBalance: result.updatedCustomer.points,
        date: result.transaction.date,
      },
      message: 'Transaction created successfully',
    };

    // Enqueue webhook
    await enqueueWebhook(authResult.businessId!, 'transaction_created', {
      transactionId: result.transaction.id,
      customerId: customer.id,
      amount: result.transaction.amount,
      pointsAwarded,
    });

    await enqueueWebhook(authResult.businessId!, 'points_awarded', {
      customerId: customer.id,
      pointsAwarded,
      newBalance: result.updatedCustomer.points,
      reason: 'transaction',
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
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      {
        error: 'Failed to create transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/transactions
 * List transactions for authenticated business
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
      businessId: authResult.businessId!,
    };

    if (customerId) {
      whereClause.customerId = parseInt(customerId);
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
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
        },
        orderBy: {
          date: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.transaction.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch transactions',
      },
      { status: 500 }
    );
  }
}

