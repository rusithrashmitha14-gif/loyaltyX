# LoyaltyX - Customer Loyalty Management Platform

A comprehensive Next.js 14 application for managing customer loyalty programs with points, rewards, and redemptions.

## Features

- **Business Dashboard**: Manage customers, transactions, rewards, and redemptions
- **Customer Portal**: View points and available rewards
- **Authentication**: Secure business login with NextAuth.js
- **Database**: PostgreSQL with Prisma ORM (Neon.tech)
- **API**: RESTful APIs for all CRUD operations
- **Analytics**: Built-in analytics dashboard with insights
- **POS Integration**: REST API for point-of-sale systems
- **Webhooks**: Event-driven notifications
- **UI**: Modern interface with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js + JWT
- **Validation**: Zod
- **Deployment**: Vercel + Neon (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or Neon.tech)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp env.example .env
   ```
   
   Update the following variables in `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/loyaltyx"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   JWT_SECRET="your-jwt-secret-here"
   AUTH_SECRET="your-auth-secret-here"
   NEXT_PUBLIC_API_URL="http://localhost:3000/api"
   NODE_ENV="development"
   ```
   
   Generate secure secrets:
   ```bash
   openssl rand -base64 32
   ```

3. **Set up the database**:
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run migrations
   npx prisma migrate deploy
   
   # Seed with sample data
   npm run db:seed
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

6. **View database (optional)**:
   ```bash
   npm run studio
   ```
   Opens Prisma Studio at [http://localhost:5555](http://localhost:5555)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # NextAuth.js authentication
│   │   ├── customers/     # Customer CRUD APIs
│   │   ├── transactions/  # Transaction APIs
│   │   ├── rewards/       # Reward CRUD APIs
│   │   └── redemptions/   # Redemption APIs
│   ├── dashboard/         # Business dashboard pages
│   ├── customer/          # Customer portal pages
│   ├── auth/              # Authentication pages
│   └── globals.css        # Global styles
├── components/
│   └── ui/                # Reusable UI components
└── lib/
    ├── prisma.ts          # Prisma client
    ├── auth.ts            # NextAuth configuration
    ├── points.ts          # Points calculation logic
    └── utils.ts           # Utility functions
```

## Database Models

- **Business**: Business accounts with authentication
- **Customer**: Customer profiles with points
- **Transaction**: Purchase transactions that earn points
- **Reward**: Rewards that can be redeemed with points
- **Redemption**: Customer redemptions of rewards

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Business login
- `POST /api/auth/signout` - Business logout

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create new customer
- `GET /api/customers/[id]` - Get customer details
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer

### Transactions
- `GET /api/transactions` - List all transactions
- `POST /api/transactions` - Record new transaction

### Rewards
- `GET /api/rewards` - List all rewards
- `POST /api/rewards` - Create new reward
- `GET /api/rewards/[id]` - Get reward details
- `PUT /api/rewards/[id]` - Update reward
- `DELETE /api/rewards/[id]` - Delete reward

### Redemptions
- `GET /api/redemptions` - List all redemptions
- `POST /api/redemptions` - Create new redemption
- `GET /api/redemptions/[id]` - Get redemption details
- `PUT /api/redemptions/[id]` - Update redemption status

## Default Login

After seeding the database, you can log in with:
- **Email**: demo@loyaltyx.com
- **Password**: password123

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Database Commands

- `npm run studio` - Open Prisma Studio (database viewer)
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:seed` - Seed database with sample data

## Production Deployment

### Quick Start (15 minutes)

Deploy to production using **Vercel** (hosting) + **Neon** (database):

1. **Generate production secrets**:
   ```bash
   # Windows
   powershell -ExecutionPolicy Bypass -File scripts/generate-secrets.ps1
   
   # Mac/Linux
   bash scripts/generate-secrets.sh
   ```

2. **Set up Neon database**:
   - Sign up at [neon.tech](https://neon.tech)
   - Create database: `loyaltyx_prod`
   - Get connection string from the dashboard

3. **Deploy to Vercel**:
   - Sign up at [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables
   - Deploy!

For detailed instructions, see:
- 📖 **Deployment Guide (Neon)**: [`DEPLOYMENT.md`](./DEPLOYMENT.md)
- 🗂️ **Supabase + Vercel**: [`SUPABASE_VERCEL_SETUP.md`](./SUPABASE_VERCEL_SETUP.md)
- 📋 **Checklist**: [`scripts/deploy-checklist.md`](./scripts/deploy-checklist.md)
- 🎯 **Command Reference**: [`DEPLOYMENT_COMMANDS.md`](./DEPLOYMENT_COMMANDS.md)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.











