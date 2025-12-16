# 🚀 LoyaltyX Deployment Checklist

Use this checklist to ensure a smooth production deployment.

---

## 📋 Pre-Deployment (Local)

### Code Quality
- [ ] All local tests passing (`npm run test:integration`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No linting errors (`npm run lint`)
- [ ] Successful local build (`npm run build`)

### Git Repository
- [ ] All changes committed to git
- [ ] Code pushed to GitHub/GitLab/Bitbucket
- [ ] Repository is accessible (not private, or Vercel has access)
- [ ] `.env` file is in `.gitignore` (never commit secrets!)

### Environment Variables Prepared
- [ ] Run `bash scripts/generate-secrets.sh` to generate production secrets
- [ ] Secrets saved securely (use password manager)
- [ ] PlanetScale connection string ready

---

## 🗄️ PlanetScale Database Setup

### Account & Database
- [ ] PlanetScale account created at [planetscale.com](https://planetscale.com)
- [ ] Database `loyaltyx_prod` created
- [ ] Region selected (closest to users)
- [ ] Branch `main` exists (default)

### Connection
- [ ] Password created in PlanetScale dashboard
- [ ] Format selected: **Prisma**
- [ ] Connection string copied and saved securely
- [ ] Connection string format verified:
  ```
  mysql://user:pass@aws.connect.psdb.cloud/loyaltyx_prod?sslaccept=strict
  ```

### Schema Deployment
- [ ] `DATABASE_URL` temporarily set to PlanetScale (in local `.env`)
- [ ] `npx prisma validate` successful
- [ ] `npx prisma generate` successful
- [ ] `npx prisma migrate deploy` successful
- [ ] All tables visible in `npm run studio`

---

## 🌐 Vercel Hosting Setup

### Account & Project
- [ ] Vercel account created at [vercel.com](https://vercel.com)
- [ ] Signed up with GitHub
- [ ] Repository imported as new project
- [ ] Framework detected as Next.js

### Build Configuration
- [ ] Framework Preset: **Next.js**
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `.next`
- [ ] Install Command: `npm ci`
- [ ] Root Directory: `./` (leave blank)

### Environment Variables Added

Core Variables:
- [ ] `DATABASE_URL` (from PlanetScale)
- [ ] `NEXTAUTH_URL` (your Vercel URL, update after deployment)
- [ ] `NEXTAUTH_SECRET` (generated secret)
- [ ] `JWT_SECRET` (generated secret)
- [ ] `AUTH_SECRET` (same as JWT_SECRET)
- [ ] `NEXT_PUBLIC_API_URL` (your Vercel URL + `/api`)
- [ ] `NODE_ENV=production`

Optional Variables (if using):
- [ ] `SENTRY_DSN` (error monitoring)
- [ ] `UPSTASH_REDIS_REST_URL` (rate limiting)
- [ ] `UPSTASH_REDIS_REST_TOKEN` (rate limiting)

### First Deployment
- [ ] Clicked "Deploy"
- [ ] Build completed without errors
- [ ] Deployment succeeded
- [ ] Production URL obtained

### Post-Deployment Configuration
- [ ] Updated `NEXTAUTH_URL` with actual Vercel URL
- [ ] Updated `NEXT_PUBLIC_API_URL` with actual Vercel URL + `/api`
- [ ] Redeployed with updated environment variables

---

## ✅ Verification & Testing

### Basic Functionality
- [ ] Homepage loads: `https://your-project.vercel.app`
- [ ] No console errors in browser DevTools (F12)
- [ ] Vercel deployment logs show no errors

### Authentication Flow
- [ ] Can access `/signup` page
- [ ] Can create a new business account
- [ ] Account appears in PlanetScale database (check with `npm run studio`)
- [ ] Can log in at `/login` with created account
- [ ] Dashboard loads at `/dashboard`

### Core Features
- [ ] Can create a customer
- [ ] Can add a transaction
- [ ] Customer points update correctly
- [ ] Can create a reward
- [ ] Can redeem a reward
- [ ] Data persists in PlanetScale database

### API Endpoints
- [ ] Test authentication: `/api/auth/signup`
- [ ] Test customers: `/api/customers`
- [ ] Test transactions: `/api/transactions`
- [ ] Test rewards: `/api/rewards`

### Database Verification
- [ ] Connect Prisma Studio to production database
- [ ] Verify all tables exist
- [ ] Verify test data is present
- [ ] Data integrity confirmed

---

## 🔒 Security Checklist

### Secrets Management
- [ ] All secrets are unique (different from development)
- [ ] Secrets are at least 32 characters long
- [ ] Secrets stored in password manager
- [ ] No secrets in git repository
- [ ] `.env` file in `.gitignore`

### Application Security
- [ ] HTTPS enforced (automatic on Vercel)
- [ ] Environment variables not exposed to client
- [ ] API routes have proper authentication
- [ ] Input validation on all forms (Zod)
- [ ] SQL injection protected (Prisma ORM)

### Access Control
- [ ] Only authorized team members have Vercel access
- [ ] Only authorized team members have PlanetScale access
- [ ] Production secrets not shared via insecure channels (email, Slack)

---

## 📊 Monitoring Setup (Optional)

### Error Tracking
- [ ] Sentry account created (optional)
- [ ] Sentry DSN added to Vercel environment variables
- [ ] Test error sent to verify integration

### Analytics
- [ ] Vercel Analytics enabled (automatic on paid plans)
- [ ] Can access analytics dashboard

### Logging
- [ ] Vercel deployment logs accessible
- [ ] PlanetScale query insights enabled
- [ ] Critical events logged

---

## 🔄 Continuous Deployment

### Automatic Deployments
- [ ] Push to `main` branch triggers automatic deployment
- [ ] Preview deployments work for pull requests
- [ ] Build status visible in GitHub commits

### Rollback Plan
- [ ] Know how to rollback in Vercel (Deployments → Promote to Production)
- [ ] PlanetScale backup retention confirmed
- [ ] Team knows rollback procedure

---

## 📚 Documentation

### Internal Documentation
- [ ] Deployment process documented (this checklist!)
- [ ] Environment variables documented
- [ ] Team has access to secrets (securely)
- [ ] Emergency contacts documented

### External Documentation (if public API)
- [ ] API documentation updated
- [ ] Integration guides published
- [ ] Terms of Service added
- [ ] Privacy Policy added

---

## 🎯 Go-Live Checklist

### Final Checks Before Launch
- [ ] All checklist items above completed
- [ ] Tested full user journey end-to-end
- [ ] No critical errors in last 24 hours
- [ ] Performance acceptable (Lighthouse score > 80)
- [ ] Mobile responsive design verified

### Launch Day
- [ ] Monitor Vercel deployment logs
- [ ] Monitor Sentry for errors (if configured)
- [ ] Watch PlanetScale query performance
- [ ] Be available for immediate fixes

### Post-Launch (Within 24 Hours)
- [ ] Check error rates
- [ ] Review analytics
- [ ] Collect initial user feedback
- [ ] Fix any critical issues

### Post-Launch (Within 7 Days)
- [ ] Performance optimization if needed
- [ ] Address user feedback
- [ ] Plan next iteration

---

## 🎉 Congratulations!

If all items are checked, your LoyaltyX application is **production-ready**!

### Next Steps
1. Share the production URL with stakeholders
2. Onboard pilot businesses
3. Monitor usage and errors
4. Iterate based on feedback

### Support Resources
- **Deployment Guide**: `PLANETSCALE_VERCEL_SETUP.md`
- **Full Documentation**: `DEPLOYMENT.md`
- **Vercel Dashboard**: https://vercel.com/dashboard
- **PlanetScale Console**: https://app.planetscale.com

---

**Date Completed**: _______________
**Deployed By**: _______________
**Production URL**: _______________
**Notes**: 

---

**Keep this checklist for future deployments and reference!**


