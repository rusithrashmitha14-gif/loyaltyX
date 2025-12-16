# 🎯 LoyaltyX Deployment - Command Reference

Quick reference for all deployment commands. Keep this handy during deployment!

---

## 🔐 1. Generate Production Secrets

### Windows (PowerShell)
```powershell
powershell -ExecutionPolicy Bypass -File scripts/generate-secrets.ps1
```

### Mac/Linux (Bash)
```bash
bash scripts/generate-secrets.sh
```

### Manual Generation
```bash
# Generate 3 different secrets
openssl rand -base64 32
openssl rand -base64 32
openssl rand -base64 32
```

**Save output**: Store securely in password manager

---

## 🗄️ 2. PlanetScale Database Commands

### Set Connection String

**Windows (PowerShell):**
```powershell
$env:DATABASE_URL="mysql://user:pass@aws.connect.psdb.cloud/loyaltyx_prod?sslaccept=strict"
```

**Mac/Linux (Bash):**
```bash
export DATABASE_URL="mysql://user:pass@aws.connect.psdb.cloud/loyaltyx_prod?sslaccept=strict"
```

### Deploy Schema to PlanetScale
```bash
# Validate schema
npx prisma validate

# Generate Prisma Client
npx prisma generate

# Deploy migrations
npx prisma migrate deploy
```

### View Database
```bash
# Open Prisma Studio (new shortcut!)
npm run studio

# Or the long way
npx prisma studio
```

---

## 🌐 3. Vercel Deployment

### Environment Variables to Add

Copy these to Vercel → Settings → Environment Variables:

```env
DATABASE_URL=mysql://xxx:pscale_pw_xxx@aws.connect.psdb.cloud/loyaltyx_prod?sslaccept=strict
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=<generated-secret-1>
JWT_SECRET=<generated-secret-2>
AUTH_SECRET=<generated-secret-3>
NEXT_PUBLIC_API_URL=https://your-project.vercel.app/api
NODE_ENV=production
```

### Vercel CLI (Optional)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# View logs
vercel logs
```

---

## ✅ 4. Verification Commands

### Test API Endpoints

**Signup:**
```bash
curl -X POST https://your-project.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Business",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST https://your-project.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Check Build Locally
```bash
# Build for production
npm run build

# Run production build locally
npm start

# Visit http://localhost:3000
```

---

## 🔄 5. Post-Deployment Updates

### Push Code Changes
```bash
git add .
git commit -m "Feature update"
git push origin main
# Vercel deploys automatically!
```

### Update Database Schema
```bash
# 1. Make changes to prisma/schema.prisma
# 2. Create migration locally
npx prisma migrate dev --name your_migration_name

# 3. Commit migration
git add prisma/migrations
git commit -m "Add database migration"
git push

# 4. Deploy migration to production
# (Set DATABASE_URL to PlanetScale first)
npx prisma migrate deploy
```

### Update Environment Variables
```
1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Edit variable
4. Deployments → Redeploy (for changes to take effect)
```

---

## 🛠️ 6. Development Commands

### Local Development
```bash
# Start dev server
npm run dev

# Open Prisma Studio
npm run studio

# Run linter
npm run lint

# Run tests
npm run test:integration
```

### Database Management
```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes (dev only!)
npm run db:push

# Create migration (dev only!)
npm run db:migrate

# Seed database
npm run db:seed
```

---

## 🚨 7. Troubleshooting Commands

### Check Prisma Connection
```bash
npx prisma validate
npx prisma db pull  # Pull schema from database
```

### Regenerate Prisma Client
```bash
npx prisma generate
```

### Check TypeScript Errors
```bash
npx tsc --noEmit
```

### View Vercel Logs
```bash
# Install CLI first
npm install -g vercel

# View logs
vercel logs <deployment-url>
```

### Test Production Build Locally
```bash
npm run build
npm start
# Visit http://localhost:3000
```

---

## 📊 8. Monitoring & Maintenance

### View Database
```bash
npm run studio
# Opens http://localhost:5555
```

### Check Database Size (PlanetScale CLI)
```bash
# Install PlanetScale CLI
# Mac/Linux:
brew install planetscale/tap/pscale

# Windows: Download from https://github.com/planetscale/cli

# Login
pscale auth login

# List databases
pscale database list

# Check database info
pscale database show loyaltyx_prod
```

### Vercel Deployment Status
```bash
# Check deployments
vercel ls

# Check specific deployment
vercel inspect <deployment-url>
```

---

## 🔄 9. Emergency Rollback

### Rollback Vercel Deployment
```
1. Go to Vercel Dashboard
2. Deployments tab
3. Find last working deployment
4. Click "..." → "Promote to Production"
```

### Rollback Database (if needed)
```bash
# Create branch from backup
pscale branch create loyaltyx_prod main --from backup-YYYYMMDD

# Update DATABASE_URL to new branch temporarily
# Test thoroughly
# Promote branch when ready
```

---

## 🎯 Quick Copy-Paste Checklist

Run these in order for first deployment:

```bash
# 1. Generate secrets
powershell -ExecutionPolicy Bypass -File scripts/generate-secrets.ps1

# 2. Set PlanetScale URL (replace with your actual URL)
$env:DATABASE_URL="mysql://user:pass@aws.connect.psdb.cloud/loyaltyx_prod?sslaccept=strict"

# 3. Deploy schema
npx prisma migrate deploy

# 4. Verify database
npm run studio

# 5. Push code to GitHub (triggers Vercel deploy)
git add .
git commit -m "Production deployment setup"
git push origin main

# 6. After Vercel deployment, test
# (Replace URL with your actual Vercel URL)
curl -X POST https://your-project.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'
```

---

## 📱 URLs to Bookmark

| Service | URL |
|---------|-----|
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **PlanetScale Console** | https://app.planetscale.com |
| **Your Production App** | https://your-project.vercel.app |
| **Prisma Studio** | http://localhost:5555 |

---

## 💡 Pro Tips

1. **Always test locally first**: `npm run build && npm start`
2. **Use Prisma Studio**: `npm run studio` to view database anytime
3. **Check Vercel logs**: Errors show up immediately
4. **Keep secrets secure**: Never commit `.env` files
5. **Regular backups**: PlanetScale auto-backups, but export weekly for safety

---

## 🔑 Common Environment Variable Patterns

### Local Development (.env)
```env
DATABASE_URL="mysql://root:@localhost:3306/loyaltyx"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

### Production (Vercel)
```env
DATABASE_URL="mysql://xxx@aws.connect.psdb.cloud/loyaltyx_prod?sslaccept=strict"
NEXTAUTH_URL="https://your-project.vercel.app"
NODE_ENV="production"
```

### Staging (Optional)
```env
DATABASE_URL="mysql://xxx@aws.connect.psdb.cloud/loyaltyx_staging?sslaccept=strict"
NEXTAUTH_URL="https://your-project-staging.vercel.app"
NODE_ENV="production"
```

---

## 🎉 Success Indicators

✅ **PlanetScale**: Tables visible in Prisma Studio
✅ **Vercel**: Build completed, deployment successful
✅ **Application**: Homepage loads, can sign up/login
✅ **Database**: Test data appears in Prisma Studio

---

**Keep this file open in a tab during deployment for quick reference!**

---

**Last Updated**: October 2024


