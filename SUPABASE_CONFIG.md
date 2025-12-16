# Supabase Configuration for LoyaltyX

## Credentials

**Project URL**: https://rehqncmqjfbatmtujnee.supabase.co  
**Project Ref**: rehqncmqjfbatmtujnee  
**Username**: rusithrashmitha14-gif  

## Database Connection Strings

To get your actual database connection strings:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/rehqncmqjfbatmtujnee
2. Navigate to **Settings → Database**
3. Under **Connection string**, you'll find:
   - **Connection pooling** (uses port 6543) - use this for `DATABASE_URL`
   - **Direct connection** (uses port 5432) - use this for `DIRECT_URL`

The connection strings will look like:
```
# Pooled connection (for DATABASE_URL)
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require

# Direct connection (for DIRECT_URL)
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require
```

## Environment Variables Setup

Create a `.env.local` file in your project root with:

```env
# Database
DATABASE_URL="YOUR_POOLED_CONNECTION_STRING_HERE"
DIRECT_URL="YOUR_DIRECT_CONNECTION_STRING_HERE"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Authentication
AUTH_SECRET="generate-with-openssl-rand-base64-32"
JWT_SECRET="generate-with-openssl-rand-base64-32"

# Application
NODE_ENV="development"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# Supabase Public Keys (optional)
NEXT_PUBLIC_SUPABASE_URL="https://rehqncmqjfbatmtujnee.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlaHFuY21xamZiYXRtdHVqbmVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Nzc0NjQsImV4cCI6MjA4MTQ1MzQ2NH0.8hy1dAZM2JhPRptscjMPTdkQrsTntHpNnqRSUoDnAFY"
```

## Generate Secrets

Run these commands to generate secure secrets:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate AUTH_SECRET
openssl rand -base64 32

# Generate JWT_SECRET
openssl rand -base64 32
```

Or use the provided script:
```bash
# Windows PowerShell
.\scripts\generate-secrets.ps1

# Linux/Mac
bash scripts/generate-secrets.sh
```

## Initialize Database

After setting up your environment variables:

```bash
# Install dependencies
npm install

# Generate Prisma Client
npm run db:generate

# Push schema to Supabase
npm run db:push

# (Optional) Seed sample data
npm run db:seed
```

## Vercel Deployment

For production deployment on Vercel, add these environment variables in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add all the variables from above (use production values for URLs)
4. Update `NEXTAUTH_URL` to your production domain
5. Update `NEXT_PUBLIC_API_URL` to `https://your-domain.vercel.app/api`
