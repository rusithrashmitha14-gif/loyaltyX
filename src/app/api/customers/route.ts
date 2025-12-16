import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth-middleware';

// GET /api/customers - Get all customers or single customer by ID
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
      // Get single customer by ID (must belong to authenticated business)
      const customer = await prisma.customer.findFirst({
        where: {
          id: parseInt(id),
          businessId: businessId // Ensure customer belongs to authenticated business
        },
        include: {
          business: true,
          transactions: true,
          redemptions: {
            include: {
              reward: true,
            },
          },
        },
      });

      if (!customer) {
        return NextResponse.json(
          {
            status: 'error',
            error: 'Customer not found'
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        status: 'success',
        data: customer,
      });
    } else {
      // Get all customers for the authenticated business
      const customers = await prisma.customer.findMany({
        where: { businessId: businessId },
        include: {
          business: true,
          transactions: true,
          redemptions: {
            include: {
              reward: true,
            },
          },
        },
        orderBy: {
          id: 'desc',
        },
      });

      return NextResponse.json({
        status: 'success',
        data: customers,
        count: customers.length,
      });
    }
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to fetch customers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create new customer
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
    const { name, email, phone, points = 0 } = body;
    const businessId = authResult.businessId; // Use authenticated business ID

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Missing required fields: name, email'
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email },
    });

    if (existingCustomer) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Customer with this email already exists'
        },
        { status: 409 }
      );
    }

    // Ensure businessId is defined (it will be from authentication)
    if (!businessId) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Business ID not found'
        },
        { status: 401 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone: phone || null,
        points,
        businessId,
      },
      include: {
        business: true,
      },
    });

    return NextResponse.json({
      status: 'success',
      data: customer,
      message: 'Customer created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to create customer',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/customers?id=1 - Update customer by ID
export async function PUT(request: NextRequest) {
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

    if (!id) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Customer ID is required'
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, phone, points } = body;
    const businessId = authResult.businessId;

    // Check if customer exists and belongs to authenticated business
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: parseInt(id),
        businessId: businessId
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Customer not found'
        },
        { status: 404 }
      );
    }

    // Check if email is being changed and already exists
    if (email && email !== existingCustomer.email) {
      const emailExists = await prisma.customer.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          {
            status: 'error',
            error: 'Customer with this email already exists'
          },
          { status: 409 }
        );
      }
    }

    // Business ownership cannot be changed through authentication
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (points !== undefined) updateData.points = points;

    const customer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        business: true,
      },
    });

    return NextResponse.json({
      status: 'success',
      data: customer,
      message: 'Customer updated successfully',
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to update customer',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/customers?id=1 - Delete customer by ID
export async function DELETE(request: NextRequest) {
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

    if (!id) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Customer ID is required'
        },
        { status: 400 }
      );
    }

    // Check if customer exists and belongs to authenticated business
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: parseInt(id),
        businessId: authResult.businessId
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Customer not found'
        },
        { status: 404 }
      );
    }

    await prisma.customer.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      status: 'success',
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to delete customer',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}




