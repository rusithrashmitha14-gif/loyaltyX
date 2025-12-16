import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create a sample business
  const hashedPassword = await bcrypt.hash('password123', 12)
  
  const business = await prisma.business.upsert({
    where: { email: 'demo@loyaltyx.com' },
    update: {},
    create: {
      email: 'demo@loyaltyx.com',
      password: hashedPassword,
      name: 'Demo Coffee Shop',
    },
  })

  // Create sample customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { email: 'john@example.com' },
      update: {},
      create: {
        email: 'john@example.com',
        name: 'John Doe',
        phone: '+1 (555) 111-1111',
        points: 150,
        businessId: business.id,
      },
    }),
    prisma.customer.upsert({
      where: { email: 'jane@example.com' },
      update: {},
      create: {
        email: 'jane@example.com',
        name: 'Jane Smith',
        phone: '+1 (555) 222-2222',
        points: 75,
        businessId: business.id,
      },
    }),
  ])

  // Create sample rewards
  const rewards = await Promise.all([
    prisma.reward.upsert({
      where: { id: 1 },
      update: {},
      create: {
        title: 'Free Coffee',
        description: 'Get a free medium coffee',
        pointsRequired: 100,
        businessId: business.id,
      },
    }),
    prisma.reward.upsert({
      where: { id: 2 },
      update: {},
      create: {
        title: '20% Off',
        description: 'Get 20% off your next purchase',
        pointsRequired: 200,
        businessId: business.id,
      },
    }),
  ])

  // Create sample transactions
  await Promise.all([
    prisma.transaction.create({
      data: {
        amount: 15.50,
        businessId: business.id,
        customerId: customers[0].id,
      },
    }),
    prisma.transaction.create({
      data: {
        amount: 8.75,
        businessId: business.id,
        customerId: customers[1].id,
      },
    }),
  ])

  console.log('Seed data created successfully!')
  console.log('Business:', business.email)
  console.log('Customers:', customers.length)
  console.log('Rewards:', rewards.length)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })








