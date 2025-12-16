# 🚀 Deploy LoyaltyX to Production: Neon + Vercel

This guide walks you through deploying LoyaltyX to production using **Neon.tech** (PostgreSQL) and **Vercel** (hosting).

---

## 📋 What You'll Build

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Application** | Vercel | Serverless Next.js hosting |
| **Database** | Neon | Serverless PostgreSQL |
| **Prisma Studio** | Local | Database management UI |

**Total Time:** ~15-20 minutes

---

## 🎯 Prerequisites

- GitHub account
- Vercel account (free)
- Neon account (free)
- Your LoyaltyX project pushed to GitHub

---

## Step 1: Generate Production Secrets (2 minutes)

### Windows (PowerShell)
```powershell
powershell -ExecutionPolicy Bypass -File scripts/generate-secrets.ps1
```

### Mac/Linux
```bash
bash scripts/generate-secrets.sh
```

### Or Manually
```bash
openssl rand -base64 32  # Run 3 times for 3 different secrets
```

**Save these secrets** - you'll need them for Vercel environment variables!

---

## Step 2: Create Neon Database (5 minutes)

### A. Create Account & Project

1. Go to [console.neon.tech](https://console.neon.tech)
2. Sign up with GitHub (recommended)
3. Click **"Create Project"**

### B. Configure Project

- **Project Name**: `loyaltyx-prod`
- **Region**: Choose closest to your users (e.g., `us-east-2`, `eu-central-1`)
- **PostgreSQL Version**: 16 (latest)
- **Compute**: Shared (Free tier is fine to start)

Click **"Create Project"**

### C. Get Connection String

After creation, you'll see the connection details:

1. Select **"Prisma"** from the connection string dropdown
2. Copy the connection string (it looks like this):
   ```
   postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. **Save this** - you'll need it for both local testing and Vercel deployment

**Important:** Your password is shown only once. If you lose it:
- Go to **Settings** → **Reset Password** in Neon dashboard

### D. Test Connection Locally (Optional but Recommended)

```bash
# Set DATABASE_URL temporarily
export DATABASE_URL="postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Deploy schema to Neon
npx prisma migrate deploy

# Verify with Prisma Studio
npx prisma studio
```

You should see empty tables. Perfect! ✅

---

## Step 3: Deploy to Vercel (5 minutes)

### A. Import Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Sign in with GitHub
3. Click **"Import Git Repository"**
4. Select your `loyaltyx` repository
5. Framework Preset: **Next.js** (auto-detected)

### B. Configure Environment Variables

Before deploying, add these environment variables:

Click **"Environment Variables"** and add **all 7 variables**:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://username:password@ep-xxx.neon.tech/neondb?sslmode=require` | From Neon dashboard |
| `NEXTAUTH_URL` | `https://temp-placeholder.vercel.app` | Update after first deploy |
| `NEXTAUTH_SECRET` | `[secret-from-step-1]` | Generate with openssl |
| `JWT_SECRET` | `[secret-from-step-1]` | Use different secret |
| `AUTH_SECRET` | `[secret-from-step-1]` | Use different secret |
| `NEXT_PUBLIC_API_URL` | `https://temp-placeholder.vercel.app/api` | Update after first deploy |
| `NODE_ENV` | `production` | Exactly "production" |

**Make sure to select "Production" environment for all variables!**

### C. Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete ☕
3. Once complete, you'll get your production URL:
   ```
   https://your-project-abc123.vercel.app
   ```

### D. Update Environment Variables

Now that you have your real production URL:

1. Go to **Settings** → **Environment Variables**
2. Edit `NEXTAUTH_URL`:
   - Old: `https://temp-placeholder.vercel.app`
   - New: `https://your-project-abc123.vercel.app`
3. Edit `NEXT_PUBLIC_API_URL`:
   - Old: `https://temp-placeholder.vercel.app/api`
   - New: `https://your-project-abc123.vercel.app/api`
4. Click **Save**

### E. Redeploy

1. Go to **Deployments** tab
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. Wait 1-2 minutes

---

## Step 4: Verify Deployment (3 minutes)

### A. Test the Homepage

Visit: `https://your-project-abc123.vercel.app`

You should see the LoyaltyX homepage. ✅

### B. Test Signup API

```bash
curl -X POST https://your-project-abc123.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Business",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "business": {
    "id": 1,
    "name": "Test Business",
    "email": "test@example.com"
  }
}
```

### C. Test in Browser

1. Go to: `https://your-project-abc123.vercel.app/signup`
2. Create a business account
3. Log in at: `https://your-project-abc123.vercel.app/login`
4. Create a customer
5. Add a transaction
6. Redeem a reward

**Everything working?** 🎉 **You're live!**

### D. Verify Data in Neon

```bash
# Set your Neon connection string
export DATABASE_URL="postgresql://..."

# Open Prisma Studio
npx prisma studio
```

Check the `businesses` table - your test account should be there!

---

## 🔧 Post-Deployment Setup

### Enable Neon Branching (Optional)

Neon supports database branching (like Git for databases):

1. Go to Neon dashboard → **Branches**
2. Create a `staging` branch for testing
3. Get the staging connection string
4. Use it for preview deployments in Vercel

### Set Up Automatic Deployments

Vercel automatically deploys on every push to `main`:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Vercel will automatically build and deploy! 🚀

### Monitor Your Database

Neon provides helpful metrics:

1. Go to Neon dashboard → **Monitoring**
2. View:
   - Active connections
   - Query performance
   - Storage usage
   - Connection pooling stats

---

## 🚨 Troubleshooting

### Issue: Build Failed on Vercel

**Solution:**
1. Check Vercel build logs
2. Look for TypeScript errors or missing environment variables
3. Ensure `DATABASE_URL` is set correctly
4. Verify all required environment variables are present

### Issue: Database Connection Errors

**Solution:**
1. Verify connection string ends with `?sslmode=require`
2. Check that your Neon project is active (not paused)
3. Confirm the connection string is correct (copy-paste from Neon dashboard)
4. Ensure no firewall blocking (Neon uses standard PostgreSQL port)

### Issue: Prisma Client Not Generated

**Solution:**
```bash
npx prisma generate
git add .
git commit -m "Regenerate Prisma Client"
git push
```

### Issue: Tables Not Found

**Solution:**
You forgot to run migrations!

```bash
# Connect to your Neon database
export DATABASE_URL="postgresql://..."

# Deploy migrations
npx prisma migrate deploy
```

### Issue: "Invalid JWT" Errors

**Solution:**
1. Verify `JWT_SECRET`, `NEXTAUTH_SECRET`, and `AUTH_SECRET` are set in Vercel
2. Make sure they're different from each other
3. Regenerate secrets if needed
4. Redeploy after updating

---

## 📊 Neon Features You Should Know

### 1. Serverless & Auto-Scaling
- **Auto-pause**: Database pauses after 5 minutes of inactivity (free tier)
- **Auto-resume**: Wakes up in milliseconds on next query
- **Auto-scale**: Compute scales based on load

### 2. Branching
- Create instant database copies for testing
- Perfect for preview deployments
- No data duplication overhead

### 3. Time Travel
- Point-in-time restore (paid plans)
- Restore database to any point in the last 7-30 days
- Great for recovering from mistakes

### 4. Connection Pooling
- Built-in connection pooling (no separate service needed)
- Use `?pgbouncer=true` in connection string for pooling
- Recommended for serverless environments

---

## 🔒 Security Best Practices

### Rotate Secrets Monthly

Set a calendar reminder to rotate:
- `JWT_SECRET`
- `NEXTAUTH_SECRET`
- `AUTH_SECRET`

```bash
# Generate new secrets
openssl rand -base64 32

# Update in Vercel → Settings → Environment Variables
# Redeploy after updating
```

### Use Environment-Specific Secrets

Never use the same secrets for:
- Local development
- Staging environment
- Production environment

### Restrict Database Access

In Neon dashboard:
1. Go to **Settings** → **IP Allow List**
2. Add Vercel's IP ranges (if needed)
3. For additional security, enable IP restrictions

---

## 📈 Monitoring & Maintenance

### Neon Dashboard
- **Metrics**: View database performance
- **Operations**: Monitor active queries
- **Logs**: Debug connection issues
- **Billing**: Track usage on free tier

### Vercel Dashboard
- **Analytics**: View visitor metrics
- **Logs**: Check runtime logs
- **Performance**: Monitor response times
- **Deployments**: View deployment history

### Recommended Monitoring Tools
- **Sentry**: Error tracking ([sentry.io](https://sentry.io))
- **LogRocket**: Session replay ([logrocket.com](https://logrocket.com))
- **Better Stack**: Uptime monitoring ([betterstack.com](https://betterstack.com))

---

## 💰 Cost Estimates

### Neon (Free Tier)
- **Compute**: 0.25 CU (always free)
- **Storage**: 0.5 GB (always free)
- **Data Transfer**: 5 GB/month (always free)
- **Branches**: 1 branch (always free)

**Upgrade When:**
- Need more storage (> 0.5 GB)
- Want database to stay always-on
- Need multiple branches
- Require advanced features

### Vercel (Free Tier)
- **Bandwidth**: 100 GB/month
- **Builds**: 6,000 minutes/month
- **Serverless Functions**: 100 GB-hours
- **Edge Middleware**: 1 million invocations

**Perfect for:** Most small to medium businesses

---

## 🎯 Next Steps

### 1. Set Up Custom Domain (Optional)

In Vercel dashboard:
1. Go to **Settings** → **Domains**
2. Add your domain (e.g., `loyaltyx.com`)
3. Update DNS records
4. SSL automatically configured

### 2. Set Up Error Monitoring

```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

Add `SENTRY_DSN` to Vercel environment variables.

### 3. Enable Rate Limiting

```bash
npm install @upstash/ratelimit @upstash/redis
```

See: `docs/RATE_LIMITING.md`

### 4. Add Staging Environment

1. Create a `staging` branch in Neon
2. Get the connection string
3. In Vercel, add environment variables for **Preview** environment
4. Every PR creates a preview deployment with staging database

---

## 🆘 Support Resources

### Neon Support
- **Docs**: [neon.tech/docs](https://neon.tech/docs)
- **Discord**: [neon.tech/discord](https://neon.tech/discord)
- **Status**: [status.neon.tech](https://status.neon.tech)

### Vercel Support
- **Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Community**: [vercel.com/community](https://vercel.com/community)
- **Status**: [vercel-status.com](https://vercel-status.com)

### Prisma Support
- **Docs**: [prisma.io/docs](https://prisma.io/docs)
- **Discord**: [pris.ly/discord](https://pris.ly/discord)

---

## 🎉 Congratulations!

Your LoyaltyX app is now **live in production**!

**What you've accomplished:**
- ✅ Deployed to Vercel with serverless Next.js
- ✅ Set up Neon PostgreSQL database
- ✅ Configured secure environment variables
- ✅ Verified everything works end-to-end
- ✅ Ready to onboard customers!

**Share your production URL:**
- `https://your-project.vercel.app`

---

**Deployment Time:** ~15-20 minutes ⚡  
**Stack:** Next.js 14 + Neon PostgreSQL + Vercel  
**Cost:** $0 (Free tier) 💰  
**Auto-deploy:** Enabled ✅

**Last Updated:** October 2025  
**LoyaltyX Version:** 0.1.0

