import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export interface AuthenticatedRequest extends NextRequest {
  businessId?: number;
  businessEmail?: string;
}

export interface JWTPayload {
  businessId: number;
  email: string;
  iat?: number;
  exp?: number;
}

export async function authenticateRequest(request: NextRequest): Promise<{
  success: boolean;
  businessId?: number;
  businessEmail?: string;
  error?: string;
}> {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return {
        success: false,
        error: 'Authorization header is missing'
      };
    }

    // Check if it starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Invalid authorization format. Expected: Bearer <token>'
      };
    }

    // Extract the token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return {
        success: false,
        error: 'Token is missing'
      };
    }

    // Verify the JWT token
    const authSecret = process.env.AUTH_SECRET;
    if (!authSecret) {
      console.error('AUTH_SECRET environment variable is not set');
      return {
        success: false,
        error: 'Server configuration error'
      };
    }

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, authSecret) as JWTPayload;
    } catch (jwtError) {
      return {
        success: false,
        error: 'Invalid or expired token'
      };
    }

    // Verify business still exists in database
    const business = await prisma.business.findUnique({
      where: { id: decoded.businessId },
      select: { id: true, email: true }
    });

    if (!business) {
      return {
        success: false,
        error: 'Business account not found'
      };
    }

    // Verify email matches (in case business email was changed)
    if (business.email !== decoded.email) {
      return {
        success: false,
        error: 'Token is invalid for current business account'
      };
    }

    return {
      success: true,
      businessId: decoded.businessId,
      businessEmail: decoded.email
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

// Helper function to create middleware that protects routes
export function createAuthMiddleware() {
  return async (request: NextRequest): Promise<{
    success: boolean;
    businessId?: number;
    businessEmail?: string;
    error?: string;
    statusCode?: number;
  }> => {
    const authResult = await authenticateRequest(request);
    
    if (!authResult.success) {
      return {
        ...authResult,
        statusCode: 401
      };
    }

    return authResult;
  };
}












