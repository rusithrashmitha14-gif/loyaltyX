import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateRewardSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  pointsCost: z.number().positive().optional(),
  isActive: z.boolean().optional(),
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

    const reward = await prisma.reward.findFirst({
      where: {
        id: parseInt(params.id),
        businessId: session.user.id
      },
      include: {
        redemptions: {
          include: {
            customer: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        }
      }
    })

    if (!reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    return NextResponse.json(reward)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch reward' },
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
    const validatedData = updateRewardSchema.parse(body)

    const reward = await prisma.reward.updateMany({
      where: {
        id: parseInt(params.id),
        businessId: session.user.id
      },
      data: validatedData
    })

    if (reward.count === 0) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Reward updated successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update reward' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reward = await prisma.reward.deleteMany({
      where: {
        id: parseInt(params.id),
        businessId: session.user.id
      }
    })

    if (reward.count === 0) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Reward deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete reward' },
      { status: 500 }
    )
  }
}








