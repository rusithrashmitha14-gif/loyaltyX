import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateApiKey } from '@/lib/api-key-auth';
import { checkIdempotency, storeIdempotentResponse } from '@/lib/idempotency';
import { enqueueWebhook } from '@/lib/webhooks';

/**
 * GET /api/integrations/customers
 * List customers for the authenticated business
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
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');

    const whereClause: any = {
      businessId: authResult.businessId!,
    };

    if (email) whereClause.email = email;
    if (phone) whereClause.phone = phone;

    const customers = await prisma.customer.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        points: true,
      },
      orderBy: {
        id: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: customers,
      count: customers.length,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch customers',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/customers
 * Create or update customer (upsert)
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
    const { email, name, phone } = body;

    if (!email || !name) {
      return NextResponse.json(
        {
          error: 'Missing required fields: email, name',
        },
        { status: 400 }
      );
    }

    // Upsert customer
    const customer = await prisma.customer.upsert({
      where: { email },
      update: {
        name,
        ...(phone && { phone }),
      },
      create: {
        email,
        name,
        phone: phone || null,
        businessId: authResult.businessId!,
      },
    });

    const response = {
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        points: customer.points,
      },
      message: 'Customer created/updated successfully',
    };

    // Enqueue webhook
    await enqueueWebhook(authResult.businessId!, 'customer_created', customer);

    // Store idempotent response
    const idempotencyKey = request.headers.get('idempotency-key');
    if (idempotencyKey) {
      await storeIdempotentResponse(idempotencyKey, authResult.businessId!, {
        status: 200,
        body: response,
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating/updating customer:', error);
    return NextResponse.json(
      {
        error: 'Failed to create/update customer',
      },
      { status: 500 }
    );
  }
}

