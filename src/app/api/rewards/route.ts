import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth-middleware';

// GET /api/rewards - Get all rewards or single reward by ID
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
    const businessId = authResult.businessId; // Use authenticated business ID

    if (id) {
      // Get single reward by ID (must belong to authenticated business)
      const reward = await prisma.reward.findFirst({
        where: {
          id: parseInt(id),
          businessId: businessId
        },
        include: {
          business: true,
          redemptions: {
            include: {
              customer: true,
            },
          },
        },
      });

      if (!reward) {
        return NextResponse.json(
          {
            status: 'error',
            error: 'Reward not found'
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        status: 'success',
        data: reward,
      });
    } else {
      // Get all rewards for authenticated business
      const whereClause = { businessId: businessId };

      const rewards = await prisma.reward.findMany({
        where: whereClause,
        include: {
          business: true,
          redemptions: {
            include: {
              customer: true,
            },
          },
        },
        orderBy: {
          id: 'desc',
        },
      });

      return NextResponse.json({
        status: 'success',
        data: rewards,
        count: rewards.length,
      });
    }
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to fetch rewards',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/rewards - Create new reward
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
    const { title, description, pointsRequired } = body;
    const businessId = authResult.businessId; // Use authenticated business ID

    // Validate required fields
    if (!title || !description || pointsRequired === undefined) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Missing required fields: title, description, pointsRequired'
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

    // Validate pointsRequired is positive
    if (pointsRequired <= 0) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Points required must be greater than 0'
        },
        { status: 400 }
      );
    }

    // Business is already verified through authentication

    const reward = await prisma.reward.create({
      data: {
        title,
        description,
        pointsRequired: parseInt(pointsRequired),
        businessId,
      },
      include: {
        business: true,
      },
    });

    return NextResponse.json({
      status: 'success',
      data: reward,
      message: 'Reward created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating reward:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to create reward',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/rewards?id=1 - Update reward by ID
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Reward ID is required'
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, description, pointsRequired, businessId } = body;

    // Check if reward exists
    const existingReward = await prisma.reward.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingReward) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Reward not found'
        },
        { status: 404 }
      );
    }

    // Verify business exists if businessId is being updated
    if (businessId && businessId !== existingReward.businessId) {
      const business = await prisma.business.findUnique({
        where: { id: parseInt(businessId) },
      });

      if (!business) {
        return NextResponse.json(
          {
            status: 'error',
            error: 'Business not found'
          },
          { status: 404 }
        );
      }
    }

    // Validate pointsRequired if provided
    if (pointsRequired !== undefined && pointsRequired <= 0) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Points required must be greater than 0'
        },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (pointsRequired !== undefined) updateData.pointsRequired = parseInt(pointsRequired);
    if (businessId) updateData.businessId = parseInt(businessId);

    const reward = await prisma.reward.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        business: true,
        redemptions: {
          include: {
            customer: true,
          },
        },
      },
    });

    return NextResponse.json({
      status: 'success',
      data: reward,
      message: 'Reward updated successfully',
    });
  } catch (error) {
    console.error('Error updating reward:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to update reward',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/rewards?id=1 - Delete reward by ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Reward ID is required'
        },
        { status: 400 }
      );
    }

    // Check if reward exists
    const existingReward = await prisma.reward.findUnique({
      where: { id: parseInt(id) },
      include: {
        redemptions: true,
      },
    });

    if (!existingReward) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Reward not found'
        },
        { status: 404 }
      );
    }

    // Check if reward has redemptions
    if (existingReward.redemptions.length > 0) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Cannot delete reward that has been redeemed. Please delete redemptions first.'
        },
        { status: 400 }
      );
    }

    await prisma.reward.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      status: 'success',
      message: 'Reward deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting reward:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to delete reward',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}




