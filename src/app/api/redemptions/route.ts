import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth-middleware';

// GET /api/redemptions - Get all redemptions or single redemption by ID
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
    const rewardId = searchParams.get('rewardId');

    if (id) {
      // Get single redemption by ID (must belong to authenticated business)
      const redemption = await prisma.redemption.findFirst({
        where: { 
          id: parseInt(id),
          customer: {
            businessId: authResult.businessId
          }
        },
        include: {
          customer: true,
          reward: true,
        },
      });

      if (!redemption) {
        return NextResponse.json(
          { 
            status: 'error',
            error: 'Redemption not found' 
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        status: 'success',
        data: redemption,
      });
    } else {
      // Get all redemptions for authenticated business (optionally filter by customerId or rewardId)
      const whereClause: any = {
        customer: {
          businessId: authResult.businessId
        }
      };
      if (customerId) whereClause.customerId = parseInt(customerId);
      if (rewardId) whereClause.rewardId = parseInt(rewardId);
      
      const redemptions = await prisma.redemption.findMany({
        where: whereClause,
        include: {
          customer: true,
          reward: true,
        },
        orderBy: {
          date: 'desc',
        },
      });

      return NextResponse.json({
        status: 'success',
        data: redemptions,
        count: redemptions.length,
      });
    }
  } catch (error) {
    console.error('Error fetching redemptions:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to fetch redemptions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/redemptions - Create new redemption
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, rewardId, date } = body;

    // Validate required fields
    if (!customerId || !rewardId) {
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Missing required fields: customerId, rewardId'
        },
        { status: 400 }
      );
    }

    // Get customer and reward with validation
    const [customer, reward] = await Promise.all([
      prisma.customer.findUnique({
        where: { id: parseInt(customerId) },
      }),
      prisma.reward.findUnique({
        where: { id: parseInt(rewardId) },
      }),
    ]);

    if (!customer) {
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Customer not found' 
        },
        { status: 404 }
      );
    }

    if (!reward) {
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Reward not found' 
        },
        { status: 404 }
      );
    }

    // Check if customer has enough points
    if (customer.points < reward.pointsRequired) {
      return NextResponse.json(
        { 
          status: 'error',
          error: `Insufficient points. Customer has ${customer.points} points but needs ${reward.pointsRequired} points`,
          customerPoints: customer.points,
          requiredPoints: reward.pointsRequired,
        },
        { status: 400 }
      );
    }

    // Create redemption and update customer points in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const redemption = await tx.redemption.create({
        data: {
          date: date ? new Date(date) : new Date(),
          customerId: parseInt(customerId),
          rewardId: parseInt(rewardId),
        },
        include: {
          customer: true,
          reward: true,
        },
      });

      // Deduct points from customer
      await tx.customer.update({
        where: { id: parseInt(customerId) },
        data: {
          points: {
            decrement: reward.pointsRequired,
          },
        },
      });

      return redemption;
    });

    return NextResponse.json({
      status: 'success',
      data: result,
      message: 'Reward redeemed successfully',
      pointsDeducted: reward.pointsRequired,
      remainingPoints: customer.points - reward.pointsRequired,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating redemption:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to create redemption',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/redemptions?id=1 - Update redemption by ID
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Redemption ID is required'
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { customerId, rewardId, date } = body;

    // Check if redemption exists
    const existingRedemption = await prisma.redemption.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        reward: true,
      },
    });

    if (!existingRedemption) {
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Redemption not found'
        },
        { status: 404 }
      );
    }

    // If reward is being changed, we need to handle point adjustments
    if (rewardId && rewardId !== existingRedemption.rewardId) {
      const newReward = await prisma.reward.findUnique({
        where: { id: parseInt(rewardId) },
      });

      if (!newReward) {
        return NextResponse.json(
          { 
            status: 'error',
            error: 'New reward not found'
          },
          { status: 404 }
        );
      }

      const pointsDifference = newReward.pointsRequired - existingRedemption.reward.pointsRequired;
      
      // Check if customer has enough points for the new reward
      if (existingRedemption.customer.points + existingRedemption.reward.pointsRequired < newReward.pointsRequired) {
        return NextResponse.json(
          { 
            status: 'error',
            error: `Insufficient points for new reward. Customer needs ${newReward.pointsRequired} points but would have ${existingRedemption.customer.points + existingRedemption.reward.pointsRequired} points`,
          },
          { status: 400 }
        );
      }

      // Update redemption and adjust customer points in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const redemption = await tx.redemption.update({
          where: { id: parseInt(id) },
          data: {
            ...(date && { date: new Date(date) }),
            ...(customerId && { customerId: parseInt(customerId) }),
            rewardId: parseInt(rewardId),
          },
          include: {
            customer: true,
            reward: true,
          },
        });

        // Adjust customer points
        await tx.customer.update({
          where: { id: existingRedemption.customerId },
          data: {
            points: {
              increment: pointsDifference,
            },
          },
        });

        return redemption;
      });

      return NextResponse.json({
        status: 'success',
        data: result,
        message: 'Redemption updated successfully',
        pointsAdjustment: pointsDifference,
      });
    } else {
      // Update redemption without changing reward (no point adjustment needed)
      const updateData: any = {};
      if (date) updateData.date = new Date(date);
      if (customerId) updateData.customerId = parseInt(customerId);

      const redemption = await prisma.redemption.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          customer: true,
          reward: true,
        },
      });

      return NextResponse.json({
        status: 'success',
        data: redemption,
        message: 'Redemption updated successfully',
      });
    }
  } catch (error) {
    console.error('Error updating redemption:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to update redemption',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/redemptions?id=1 - Delete redemption by ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Redemption ID is required'
        },
        { status: 400 }
      );
    }

    // Check if redemption exists
    const existingRedemption = await prisma.redemption.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        reward: true,
      },
    });

    if (!existingRedemption) {
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Redemption not found'
        },
        { status: 404 }
      );
    }

    // Delete redemption and restore customer points in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.redemption.delete({
        where: { id: parseInt(id) },
      });

      // Restore points to customer
      await tx.customer.update({
        where: { id: existingRedemption.customerId },
        data: {
          points: {
            increment: existingRedemption.reward.pointsRequired,
          },
        },
      });
    });

    return NextResponse.json({
      status: 'success',
      message: 'Redemption deleted successfully',
      pointsRestored: existingRedemption.reward.pointsRequired,
    });
  } catch (error) {
    console.error('Error deleting redemption:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to delete redemption',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}




