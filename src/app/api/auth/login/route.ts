import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Missing required fields: email, password'
        },
        { status: 400 }
      );
    }

    // Find business by email
    const business = await prisma.business.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        createdAt: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Invalid email or password'
        },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, business.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Invalid email or password'
        },
        { status: 401 }
      );
    }

    // Generate JWT token
    const authSecret = process.env.AUTH_SECRET;
    if (!authSecret) {
      console.error('AUTH_SECRET environment variable is not set');
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Server configuration error'
        },
        { status: 500 }
      );
    }

    const token = jwt.sign(
      { 
        businessId: business.id,
        email: business.email,
      },
      authSecret,
      { expiresIn: '7d' } // Token expires in 7 days
    );

    // Return business data without password and include token
    const { password: _, ...businessData } = business;

    return NextResponse.json({
      status: 'success',
      data: {
        business: businessData,
        token,
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to login',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}












