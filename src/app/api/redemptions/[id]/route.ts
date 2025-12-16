import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateRedemptionSchema = z.object({
  status: z.enum(['pending', 'completed', 'cancelled']),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const redemption = await prisma.redemption.findFirst({
      where: {
        id: parseInt(params.id)
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        },
        reward: true
      }
    })

    if (!redemption) {
      return NextResponse.json({ error: 'Redemption not found' }, { status: 404 })
    }

    return NextResponse.json(redemption)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch redemption' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateRedemptionSchema.parse(body)

    const redemption = await prisma.redemption.updateMany({
      where: {
        id: parseInt(params.id)
      },
      data: validatedData
    })

    if (redemption.count === 0) {
      return NextResponse.json({ error: 'Redemption not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Redemption updated successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update redemption' },
      { status: 500 }
    )
  }
}








