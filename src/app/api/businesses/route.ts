import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/businesses - Get all businesses or single business by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Get single business by ID
      const business = await prisma.business.findUnique({
        where: { id: parseInt(id) },
        include: {
          customers: true,
          transactions: true,
          rewards: true,
        },
      });

      if (!business) {
        return NextResponse.json(
          { error: 'Business not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        status: 'success',
        data: business,
      });
    } else {
      // Get all businesses
      const businesses = await prisma.business.findMany({
        include: {
          customers: true,
          transactions: true,
          rewards: true,
        },
      });

      return NextResponse.json({
        status: 'success',
        data: businesses,
        count: businesses.length,
      });
    }
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to fetch businesses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/businesses - Create new business
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Missing required fields: name, email, password'
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingBusiness = await prisma.business.findUnique({
      where: { email },
    });

    if (existingBusiness) {
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Business with this email already exists'
        },
        { status: 409 }
      );
    }

    const business = await prisma.business.create({
      data: {
        name,
        email,
        password, // In production, hash this password
      },
    });

    return NextResponse.json({
      status: 'success',
      data: business,
      message: 'Business created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating business:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to create business',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/businesses?id=1 - Update business by ID
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Business ID is required'
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, password } = body;

    // Check if business exists
    const existingBusiness = await prisma.business.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingBusiness) {
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Business not found'
        },
        { status: 404 }
      );
    }

    // Check if email is being changed and already exists
    if (email && email !== existingBusiness.email) {
      const emailExists = await prisma.business.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          { 
            status: 'error',
            error: 'Business with this email already exists'
          },
          { status: 409 }
        );
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = password; // In production, hash this password

    const business = await prisma.business.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json({
      status: 'success',
      data: business,
      message: 'Business updated successfully',
    });
  } catch (error) {
    console.error('Error updating business:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to update business',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/businesses?id=1 - Delete business by ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Business ID is required'
        },
        { status: 400 }
      );
    }

    // Check if business exists
    const existingBusiness = await prisma.business.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingBusiness) {
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Business not found'
        },
        { status: 404 }
      );
    }

    await prisma.business.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      status: 'success',
      message: 'Business deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting business:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to delete business',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}












