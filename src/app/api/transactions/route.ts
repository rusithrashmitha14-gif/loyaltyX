import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculatePoints } from '@/lib/points';
import { authenticateRequest } from '@/lib/auth-middleware';

// GET /api/transactions - Get all transactions or single transaction by ID
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        {
          status: 'error',
          error: authResult.error || 'Authentication failed'
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const customerId = searchParams.get('customerId');
    const businessId = authResult.businessId; // Use authenticated business ID

    if (id) {
      // Get single transaction by ID (must belong to authenticated business)
      const transaction = await prisma.transaction.findFirst({
        where: {
          id: parseInt(id),
          businessId: businessId
        },
        include: {
          customer: true,
          business: true,
        },
      });

      if (!transaction) {
        return NextResponse.json(
          {
            status: 'error',
            error: 'Transaction not found'
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        status: 'success',
        data: transaction,
      });
    } else {
      // Get all transactions for authenticated business (optionally filter by customerId)
      const whereClause: any = { businessId: businessId };
      if (customerId) whereClause.customerId = parseInt(customerId);

      const transactions = await prisma.transaction.findMany({
        where: whereClause,
        include: {
          customer: true,
          business: true,
        },
        orderBy: {
          date: 'desc',
        },
      });

      return NextResponse.json({
        status: 'success',
        data: transactions,
        count: transactions.length,
      });
    }
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to fetch transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create new transaction
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        {
          status: 'error',
          error: authResult.error || 'Authentication failed'
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, customerId, date } = body;
    const businessId = authResult.businessId; // Use authenticated business ID

    // Validate required fields
    if (!amount || !customerId) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Missing required fields: amount, customerId'
        },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Amount must be greater than 0'
        },
        { status: 400 }
      );
    }

    // Ensure businessId is defined
    if (!businessId) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Business ID not found'
        },
        { status: 401 }
      );
    }

    // Verify customer exists and belongs to authenticated business
    const customer = await prisma.customer.findFirst({
      where: {
        id: parseInt(customerId),
        businessId: businessId,
      },
    });

    if (!customer) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Customer not found or does not belong to this business'
        },
        { status: 404 }
      );
    }

    // Business is already verified through authentication

    const points = calculatePoints(amount);

    // Create transaction and update customer points in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          amount: parseFloat(amount),
          date: date ? new Date(date) : new Date(),
          customerId: parseInt(customerId),
          businessId,
        },
      });

      // Update customer points
      await tx.customer.update({
        where: { id: parseInt(customerId) },
        data: {
          points: {
            increment: points,
          },
        },
      });

      return transaction;
    });

    return NextResponse.json({
      status: 'success',
      data: result,
      message: 'Transaction created successfully',
      pointsAwarded: points,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to create transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/transactions?id=1 - Update transaction by ID
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Transaction ID is required'
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { amount, customerId, businessId, date } = body;

    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
      },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Transaction not found'
        },
        { status: 404 }
      );
    }

    // If amount is being updated, we need to adjust customer points
    if (amount && amount !== existingTransaction.amount) {
      const oldPoints = calculatePoints(existingTransaction.amount);
      const newPoints = calculatePoints(amount);
      const pointsDifference = newPoints - oldPoints;

      // Update transaction and adjust customer points in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.update({
          where: { id: parseInt(id) },
          data: {
            amount: parseFloat(amount),
            ...(date && { date: new Date(date) }),
            ...(customerId && { customerId: parseInt(customerId) }),
            ...(businessId && { businessId: parseInt(businessId) }),
          },
        });

        // Adjust customer points
        await tx.customer.update({
          where: { id: existingTransaction.customerId },
          data: {
            points: {
              increment: pointsDifference,
            },
          },
        });

        return transaction;
      });

      return NextResponse.json({
        status: 'success',
        data: result,
        message: 'Transaction updated successfully',
        pointsAdjustment: pointsDifference,
      });
    } else {
      // Update transaction without changing points
      const updateData: any = {};
      if (date) updateData.date = new Date(date);
      if (customerId) updateData.customerId = parseInt(customerId);
      if (businessId) updateData.businessId = parseInt(businessId);

      const transaction = await prisma.transaction.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          customer: true,
          business: true,
        },
      });

      return NextResponse.json({
        status: 'success',
        data: transaction,
        message: 'Transaction updated successfully',
      });
    }
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to update transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions?id=1 - Delete transaction by ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Transaction ID is required'
        },
        { status: 400 }
      );
    }

    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
      },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Transaction not found'
        },
        { status: 404 }
      );
    }

    const pointsToRemove = calculatePoints(existingTransaction.amount);

    // Delete transaction and adjust customer points in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.transaction.delete({
        where: { id: parseInt(id) },
      });

      // Remove points from customer
      await tx.customer.update({
        where: { id: existingTransaction.customerId },
        data: {
          points: {
            decrement: pointsToRemove,
          },
        },
      });
    });

    return NextResponse.json({
      status: 'success',
      message: 'Transaction deleted successfully',
      pointsRemoved: pointsToRemove,
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to delete transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}




