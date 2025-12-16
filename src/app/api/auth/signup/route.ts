import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Invalid email format'
        },
        { status: 400 }
      );
    }

    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Password must be at least 6 characters long'
        },
        { status: 400 }
      );
    }

    // Check if business with this email already exists
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

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create the business
    const business = await prisma.business.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        // Don't return the password
      },
    });

    return NextResponse.json({
      status: 'success',
      data: business,
      message: 'Business account created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating business account:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to create business account',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}












