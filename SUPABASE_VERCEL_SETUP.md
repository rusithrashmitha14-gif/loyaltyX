# 🚀 Deploy LoyaltyX with Supabase + Vercel

Use this guide if you want Supabase to host the PostgreSQL database and Vercel to host the Next.js frontend/backend.

---

## ✅ Prerequisites
- Vercel account connected to your Git provider
- Supabase project (free is fine to start)
- Node 18+ locally if you plan to run migrations yourself

---

## 1) Create the Supabase database
1. Go to https://supabase.com/dashboard and create a **new project**.
2. Choose a **strong database password** and keep it somewhere safe.
3. After the project is ready, open **Project Settings → Database → Connection string**.
4. Copy both connection strings:
   - **Pooled (pgbouncer)** – port `6543` (use this for `DATABASE_URL` on Vercel).
   - **Direct** – port `5432` (use this for `DIRECT_URL` when running Prisma migrations).
5. Enable **SSL** (append `sslmode=require` if it is not present).

> Tip: The pooled string usually looks like  
> `postgresql://<user>:<password>@db.<project-ref>.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require`

---

## 2) Add environment variables in Vercel
In your Vercel project settings, add these variables in the **Production** environment (and Preview if you use previews):

| Key | Value |
| --- | --- |
| `DATABASE_URL` | Supabase **pooled** connection string (pgbouncer, port 6543) |
| `DIRECT_URL` | Supabase **direct** connection string (port 5432) for Prisma migrations |
| `NEXTAUTH_URL` | `https://<your-vercel-domain>` (update after first deploy) |
| `NEXTAUTH_SECRET` | Random 32+ char string |
| `JWT_SECRET` | Random 32+ char string |
| `AUTH_SECRET` | Random 32+ char string |
| `NEXT_PUBLIC_API_URL` | `https://<your-vercel-domain>/api` |
| `NODE_ENV` | `production` |

Secrets can be generated with `openssl rand -base64 32` or `scripts/generate-secrets.*`.

---

## 3) Push schema to Supabase
Prisma needs the **direct** connection when applying migrations.

Locally:
```bash
export DIRECT_URL="postgresql://...:5432/postgres?sslmode=require"
export DATABASE_URL="postgresql://...:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"

npm install
npx prisma migrate deploy   # apply existing migrations
npx prisma db seed          # optional: seed sample data
```

If you cannot run migrations locally, you can temporarily add a **Build Step** in Vercel to run `npx prisma migrate deploy`, but running it locally is more reliable.

---

## 4) Deploy to Vercel
1. Import the repo at https://vercel.com/new.
2. Verify all env vars above are present.
3. Click **Deploy**. First build may take a couple of minutes.
4. After the deployment URL is issued, update:
   - `NEXTAUTH_URL` → `https://<your-prod-url>`
   - `NEXT_PUBLIC_API_URL` → `https://<your-prod-url>/api`
5. Redeploy from the Vercel dashboard so the updated URLs take effect.

---

## 5) Post-deploy checks
- Visit the homepage: `https://<your-prod-url>/`
- Test signup: POST to `/api/auth/signup`
- Log in at `/login`, create a customer, add a transaction, redeem a reward
- View data in Supabase (SQL editor or Table view) to confirm records are written

---

## Troubleshooting
- **Prisma P1001 (cannot reach database):** confirm `sslmode=require` and that the pooled URL uses port `6543`.
- **Too many connections:** ensure you are using the pooled URL for `DATABASE_URL` and keep `connection_limit=1`.
- **Migrations fail on Vercel build:** run `prisma migrate deploy` locally against Supabase using `DIRECT_URL`, then redeploy.

---

You’re set! Supabase handles the database, Vercel handles the app layer. 🎉


