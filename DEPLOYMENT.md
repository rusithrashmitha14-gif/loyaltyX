# 🚀 LoyaltyX Production Deployment Guide

This guide walks you through deploying LoyaltyX to production using Vercel and Neon (PostgreSQL).

> Using Supabase for Postgres instead of Neon? Follow [`SUPABASE_VERCEL_SETUP.md`](./SUPABASE_VERCEL_SETUP.md) for provider-specific steps while keeping the same Vercel configuration.

---

## 📋 Table of Contents

1. [Environment Setup](#1-environment-setup)
2. [Environment Variables](#2-environment-variables)
3. [Database Setup (Neon PostgreSQL)](#3-database-setup-neon-postgresql)
4. [Deploy to Vercel](#4-deploy-to-vercel)
5. [Database Migration & Seeding](#5-database-migration--seeding)
6. [Error Monitoring (Sentry)](#6-error-monitoring-sentry)
7. [Analytics & Logging](#7-analytics--logging)
8. [Security Hardening](#8-security-hardening)
9. [Backups & Maintenance](#9-backups--maintenance)
10. [Final Launch Checklist](#10-final-launch-checklist)
11. [CI/CD Setup (Optional)](#11-cicd-setup-optional)

---

## 1️⃣ Environment Setup

### Recommended Architecture

| Environment | Purpose | Hosting |
|------------|---------|---------|
| **Local** | Development & testing | localhost |
| **Staging** | Pilot testing with seed data | Vercel (Free) + Neon (Free) |
| **Production** | Live customers | Vercel Pro + Neon Pro |

### Alternative Hosting Options

- **Railway**: Single dashboard for app + database
- **Render**: Full-stack hosting with automatic deploys
- **Fly.io**: Global edge deployment

### ✅ Success Criteria
- [ ] Environments planned and documented
- [ ] Hosting providers selected

---

## 2️⃣ Environment Variables

### Local Setup

1. Copy the example environment file:
   ```bash
   cp env.example .env
   ```

2. Generate secure secrets:
   ```bash
   # Generate JWT_SECRET and NEXTAUTH_SECRET
   openssl rand -base64 32
   ```

3. Update `.env` with your local values:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/loyaltyx"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-generated-secret-here"
   JWT_SECRET="your-generated-secret-here"
   AUTH_SECRET="your-generated-secret-here"
   NEXT_PUBLIC_API_URL="http://localhost:3000/api"
   NODE_ENV="development"
   ```

### Production Setup (Vercel)

Add these environment variables in Vercel dashboard:

| Variable | Example Value | Notes |
|----------|---------------|-------|
| `DATABASE_URL` | `postgresql://user:pass@ep-xxx.neon.tech/loyaltyx_prod?sslmode=require` | From Neon |
| `NEXTAUTH_URL` | `https://loyaltyx.vercel.app` | Your production domain |
| `NEXTAUTH_SECRET` | `[generated-secret]` | Use `openssl rand -base64 32` |
| `JWT_SECRET` | `[generated-secret]` | Use `openssl rand -base64 32` |
| `AUTH_SECRET` | `[generated-secret]` | Same as JWT_SECRET |
| `NEXT_PUBLIC_API_URL` | `https://loyaltyx.vercel.app/api` | Your API endpoint |
| `NODE_ENV` | `production` | Must be "production" |
| `SENTRY_DSN` | `https://xxx@sentry.io/xxx` | Optional: For error tracking |

### ✅ Success Criteria
- [ ] Local `.env` file created and working
- [ ] All environment variables added to Vercel
- [ ] Secrets are strong and unique
- [ ] No secrets committed to git

---

## 3️⃣ Database Setup (Neon PostgreSQL)

### Create Database

1. Sign up at [neon.tech](https://neon.tech)
2. Click **"Create Project"**
3. Configure:
   - Name: `loyaltyx_prod`
   - Region: Choose closest to your users (e.g., us-east-2)
   - PostgreSQL Version: 16 (latest)
4. Click **"Create Project"**

### Get Connection String

1. After creation, you'll see the connection details
2. Select **"Prisma"** from the dropdown
3. Copy the connection string

Example format:
```
postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Note:** Save your password immediately - it's shown only once!

### Apply Database Schema

1. Set the DATABASE_URL locally (temporarily) to test:
   ```bash
   export DATABASE_URL="postgresql://..."
   ```

2. Deploy migrations:
   ```bash
   npx prisma migrate deploy
   ```

3. Verify with Prisma Studio:
   ```bash
   npx prisma studio
   ```

### ✅ Success Criteria
- [ ] Neon database created
- [ ] Connection string copied
- [ ] Schema deployed successfully
- [ ] Can view empty tables in Prisma Studio

---

## 4️⃣ Deploy to Vercel

### Prerequisites

- Code pushed to GitHub/GitLab/Bitbucket
- Environment variables ready (from step 2)

### Deploy Steps

1. **Sign in to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Connect your GitHub account

2. **Import Project**
   - Click **"New Project"**
   - Select your repository
   - Framework Preset: **Next.js** (auto-detected)

3. **Configure Build**
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm ci` (default)

4. **Add Environment Variables**
   - Paste all production variables from step 2
   - Make sure to select "Production" environment

5. **Deploy**
   - Click **"Deploy"**
   - Wait 2-3 minutes for build

### Post-Deployment

1. Visit your production URL: `https://loyaltyx.vercel.app`
2. Check build logs for any errors
3. Test the homepage loads

### ✅ Success Criteria
- [ ] Application builds successfully
- [ ] Production URL is live
- [ ] No build errors in Vercel logs
- [ ] Homepage loads correctly

---

## 5️⃣ Database Migration & Seeding

### Production Seeding (Optional)

⚠️ **Warning**: Only seed staging environments, not production!

For **staging** environment:

```bash
# Set staging DATABASE_URL
export DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/loyaltyx_staging?sslmode=require"

# Run seed script
npm run db:seed
```

The existing `prisma/seed.ts` will create:
- 1 demo business (email: `demo@loyaltyx.com`, password: `password123`)
- 2 sample customers
- 2 sample rewards
- 2 sample transactions

### Production Data

For production, create real data through:
1. Sign up flow (`/signup`)
2. Admin dashboard
3. API integrations

### ✅ Success Criteria
- [ ] Staging environment has seed data
- [ ] Production database is empty (or has real data only)
- [ ] Can log in to staging with demo account

---

## 6️⃣ Error Monitoring (Sentry)

### Setup Sentry

1. **Create Sentry Account**
   - Sign up at [sentry.io](https://sentry.io)
   - Create a new project
   - Select **Next.js** as the platform

2. **Install Sentry SDK**
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard -i nextjs --yes
   ```

3. **Configure DSN**
   - Copy your DSN from Sentry dashboard
   - Add to `.env` and Vercel:
     ```env
     SENTRY_DSN="https://xxx@sentry.io/xxx"
     ```

4. **Redeploy**
   ```bash
   git add .
   git commit -m "Add Sentry error tracking"
   git push
   ```

### Test Error Tracking

Create a test error endpoint (remove after testing):

```typescript
// src/app/api/test-error/route.ts
export async function GET() {
  throw new Error("Test Sentry error");
}
```

Visit `/api/test-error` and check Sentry dashboard.

### ✅ Success Criteria
- [ ] Sentry integrated and deployed
- [ ] Test error appears in Sentry
- [ ] Error tracking working on production

---

## 7️⃣ Analytics & Logging

### Vercel Analytics

Vercel Analytics is automatically enabled on paid plans.

1. Go to Vercel dashboard → **Analytics** tab
2. View real-time visitor data

### Request Logging

For API request logging, consider:
- **Logtail** (free tier available)
- **Axiom** (serverless logging)
- **Vercel Logs** (built-in, 1-day retention on free tier)

### Audit Logging (Optional)

Add database audit trail:

```prisma
// prisma/schema.prisma
model AuditLog {
  id        Int      @id @default(autoincrement())
  action    String   // "CREATE", "UPDATE", "DELETE"
  entity    String   // "Customer", "Transaction", etc.
  entityId  Int
  userId    Int?
  metadata  Json?
  createdAt DateTime @default(now())
}
```

### ✅ Success Criteria
- [ ] Analytics dashboard accessible
- [ ] Can trace transaction flows
- [ ] Critical events logged

---

## 8️⃣ Security Hardening

### Security Checklist

- [x] **HTTPS Only**: Vercel enforces HTTPS automatically
- [ ] **Rotate Secrets**: Set calendar reminder for monthly JWT_SECRET rotation
- [ ] **Rate Limiting**: Implement rate limiting (see below)
- [ ] **Input Validation**: All API routes use Zod validation
- [ ] **CORS Configuration**: Restrict to trusted domains only
- [ ] **Admin Routes**: Protect `/api/admin/*` routes
- [ ] **SQL Injection**: Using Prisma ORM (protected by default)
- [ ] **XSS Protection**: Next.js escapes by default
- [ ] **Environment Variables**: Never expose secrets client-side

### Add Rate Limiting

Install Upstash rate limiting:

```bash
npm install @upstash/ratelimit @upstash/redis
```

Create rate limit middleware:

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
  analytics: true,
});
```

Apply to API routes:

```typescript
import { ratelimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  
  // ... rest of your handler
}
```

### ✅ Success Criteria
- [ ] All security checklist items completed
- [ ] Rate limiting active on public APIs
- [ ] No sensitive data in browser console
- [ ] Security headers configured

---

## 9️⃣ Backups & Maintenance

### Neon Backups

Neon automatically backs up your database:
- **Free Tier**: 7-day point-in-time restore
- **Pro Plan**: 30-day point-in-time restore
- **Enterprise**: Custom retention

Check your backup settings:
1. Go to Neon dashboard
2. Click on your project
3. Navigate to **Settings** → **Storage**

### Point-in-Time Restore

Restore your database to any point in time:

1. Go to Neon dashboard → **Branches**
2. Click **"Restore"**
3. Select the date and time
4. Create a new branch from that point
5. Test the restored data
6. Promote to production if needed

### Manual Backups (Optional)

Export weekly backups using pg_dump:

```bash
# Install PostgreSQL client tools
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt install postgresql-client

# Export database
pg_dump $DATABASE_URL > loyaltyx-backup-$(date +%Y%m%d).sql

# Or export specific tables
pg_dump $DATABASE_URL -t businesses -t customers > backup.sql
```

Store backups in:
- AWS S3
- Google Cloud Storage
- Encrypted local storage

### Test Restore

Before launch, test restoring from a backup:

1. In Neon dashboard, create a new branch
2. Select **"Restore from history"**
3. Choose a restore point
4. Test the restored data
5. Delete the test branch when done

### ✅ Success Criteria
- [ ] Backup retention period confirmed
- [ ] Manual backup script created (optional)
- [ ] Successfully restored from a test backup

---

## 🔟 Final Launch Checklist

### Pre-Launch Tasks

- [ ] Update production logo and favicon
- [ ] Remove all seed/test data from production DB
- [ ] Test complete user flow:
  - [ ] Business sign up
  - [ ] Customer creation
  - [ ] Points earning (transaction)
  - [ ] Reward redemption
  - [ ] Email notifications (if implemented)
- [ ] Add legal pages:
  - [ ] Terms of Service
  - [ ] Privacy Policy
  - [ ] Cookie Policy (if using cookies)
- [ ] Configure custom domain (optional)
- [ ] Set up status page (e.g., status.loyaltyx.com)

### Performance Checks

- [ ] Lighthouse score > 90
- [ ] API response times < 500ms
- [ ] Database queries optimized
- [ ] Images optimized and using Next.js Image
- [ ] Unused dependencies removed

### Documentation

- [ ] API documentation up to date
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Emergency rollback procedure documented

### Pilot Launch

1. **Select 1-3 pilot businesses**
2. **Guide them through signup**
3. **Monitor for 1 week**:
   - Check error rates in Sentry
   - Review analytics
   - Collect feedback
4. **Fix critical issues**
5. **Expand to more users**

### ✅ Success Criteria
- [ ] A pilot business completes full flow end-to-end
- [ ] No critical errors in 24 hours
- [ ] Legal pages accessible
- [ ] All tests passing

---

## 1️⃣1️⃣ CI/CD Setup (Optional)

### GitHub Actions Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: LoyaltyX CI/CD

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Type check
        run: npx tsc --noEmit
      
      - name: Build application
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}

  deploy-preview:
    runs-on: ubuntu-latest
    needs: lint-and-test
    if: github.event_name == 'pull_request'
    
    steps:
      - name: Deploy to Vercel Preview
        run: echo "Vercel automatically deploys previews for PRs"
```

### Vercel Auto-Deploy

Vercel automatically deploys:
- **Production**: On push to `main` branch
- **Preview**: On every pull request

Configure branch protection:
1. Go to GitHub repository settings
2. **Branches** → **Add rule**
3. Branch name: `main`
4. Enable:
   - [ ] Require pull request reviews
   - [ ] Require status checks (CI passing)
   - [ ] Require branches to be up to date

### ✅ Success Criteria
- [ ] CI pipeline runs on every push
- [ ] Tests must pass before merge
- [ ] Automatic deployment to production

---

## 🎯 Quick Reference

### Common Commands

```bash
# Local development
npm run dev

# Database operations
npx prisma migrate dev        # Create migration
npx prisma migrate deploy     # Deploy to production
npx prisma studio            # View database
npm run db:seed              # Seed database

# Build and deploy
npm run build                # Build for production
npm start                    # Run production build locally

# Testing
npm run test:integration     # Run integration tests
npm run lint                 # Run ESLint
```

### Important URLs

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Neon Console**: https://console.neon.tech
- **Sentry Dashboard**: https://sentry.io
- **Production App**: https://loyaltyx.vercel.app
- **API Docs**: https://loyaltyx.vercel.app/api/docs

### Emergency Contacts

- **Vercel Support**: support@vercel.com
- **Neon Support**: support@neon.tech
- **Sentry Support**: support@sentry.io

### Rollback Procedure

If production breaks:

1. **Instant Rollback** (Vercel):
   ```bash
   # In Vercel dashboard, go to Deployments
   # Click on last working deployment
   # Click "Promote to Production"
   ```

2. **Database Rollback** (if needed):
   - Go to Neon dashboard → **Branches**
   - Click **"Restore from history"**
   - Select restore point before the issue
   - Create a new branch
   - Update DATABASE_URL in Vercel to point to new branch
   - Verify functionality
   - Update production to use the restored branch

---

## 📞 Support

If you encounter issues:

1. Check Vercel build logs
2. Check Sentry for error traces
3. Review environment variables
4. Verify database connectivity
5. Check Neon monitoring and query insights

---

## 📝 License

This deployment guide is part of the LoyaltyX project.

---

**Last Updated**: October 2025
**Maintained By**: LoyaltyX Team

