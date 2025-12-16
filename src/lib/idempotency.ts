import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';

/**
 * Check if request has been processed before using Idempotency-Key header
 * Returns stored response if found, null if this is a new request
 */
export async function checkIdempotency(
  request: NextRequest,
  businessId: number
): Promise<NextResponse | null> {
  const idempotencyKey = request.headers.get('idempotency-key');

  if (!idempotencyKey) {
    return null; // No idempotency key provided
  }

  try {
    // Check if this key has been used before
    const existing = await prisma.idempotencyKey.findFirst({
      where: {
        key: idempotencyKey,
        businessId: businessId,
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
    });

    if (existing) {
      // Return cached response
      const cachedResponse = JSON.parse(existing.response);
      return NextResponse.json(cachedResponse.body, {
        status: cachedResponse.status,
      });
    }

    return null; // New request
  } catch (error) {
    console.error('Idempotency check error:', error);
    return null; // Proceed with request on error
  }
}

/**
 * Store response for idempotent request
 */
export async function storeIdempotentResponse(
  idempotencyKey: string,
  businessId: number,
  response: { status: number; body: any }
): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    await prisma.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        businessId,
        response: JSON.stringify(response),
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Failed to store idempotent response:', error);
    // Don't throw - this is not critical
  }
}

/**
 * Clean up expired idempotency keys (call this periodically)
 */
export async function cleanupExpiredIdempotencyKeys(): Promise<number> {
  try {
    const result = await prisma.idempotencyKey.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  } catch (error) {
    console.error('Failed to cleanup idempotency keys:', error);
    return 0;
  }
}

