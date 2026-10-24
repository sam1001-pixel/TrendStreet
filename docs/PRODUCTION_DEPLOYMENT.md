# Trend Street — Production Deployment & Runbook Guide

This runbook details the architecture, zero-downtime deployment process, database connection pooling strategy, and disaster recovery plan for **Trend Street** in production.

---

## 1. Production Architecture Overview

```
                                [ Cloudflare Edge / Vercel Edge ]
                                   - SSL/TLS Termination
                                   - DDoS Mitigation & WAF
                                   - Static Asset Caching (Edge Cache)
                                   - Route-level No-Store Cache-Control
                                                   │
                                                   ▼
                                  [ Next.js 14 App Router ]
                                   - Node.js 20 Serverless / Container
                                   - Edge Middleware Auth Verification
                                   - Handler-Level requireAdminSession
                                   - Distributed / In-Memory Rate Limiting
                                                   │
                         ┌─────────────────────────┴────────────────────────┐
                         │                                                  │
                         ▼                                                  ▼
             [ PostgreSQL Database ]                             [ External APIs ]
         (Supabase / Neon / AWS RDS)                             - Razorpay (Payments)
          PgBouncer Pool (Port 6543)                             - Shiprocket (Logistics)
          Transaction Pooling Enabled                            - Resend (Transactional Email)
                                                                 - Upstash Redis (Rate Limiter)
```

---

## 2. Environment Variables Checklist

Ensure the following variables are configured in your deployment platform (e.g., Vercel Project Settings or AWS Parameter Store):

### Database & Session
- `DATABASE_URL`: `postgresql://user:pass@ep-host.region.aws.neon.tech:6543/trendstreet?sslmode=require&pgbouncer=true`
- `DIRECT_URL`: `postgresql://user:pass@ep-host.region.aws.neon.tech:5432/trendstreet?sslmode=require` (Used for migrations)
- `SESSION_SECRET`: 64-character cryptographically secure hex string (`openssl rand -hex 32`)

### Administrative Credentials
- `ADMIN_EMAIL`: `admin@trendstreet.in`
- `ADMIN_PASSWORD_HASH`: Salted bcrypt hash generated using `scripts/hash-password.js`

### Payment Gateway (Razorpay India)
- `RAZORPAY_KEY_ID`: `rzp_live_...` (or `rzp_test_...` in staging)
- `RAZORPAY_KEY_SECRET`: Razorpay Secret Key
- `RAZORPAY_WEBHOOK_SECRET`: Configured in Razorpay Webhooks dashboard
- `ALLOW_LIVE_PAYMENTS`: `"true"` (ONLY enable after testing in staging!)

### Logistics Provider (Shiprocket)
- `SHIPROCKET_EMAIL`: Registered business email on Shiprocket
- `SHIPROCKET_PASSWORD`: Shiprocket API account password

### Distributed Rate Limiting (Optional / Recommended)
- `UPSTASH_REDIS_REST_URL`: `https://...upstash.io`
- `UPSTASH_REDIS_REST_TOKEN`: Upstash REST token

### Email Provider (Resend)
- `RESEND_API_KEY`: `re_...`
- `FROM_EMAIL`: `orders@trendstreet.in`

---

## 3. Database Connection Pooling & Migrations

### Connection Pooling Rules
1. Serverless runtimes spin up multiple concurrent instances during traffic spikes (drops/sales). **Always connect through PgBouncer** (e.g. Supabase port 6543 or Neon pooled connection string).
2. Set `connection_limit=10` and `pool_timeout=15` in `DATABASE_URL` query parameters to prevent Postgres server connection exhaustion.
3. Use Prisma client singleton (`src/lib/prisma.ts`) throughout all route handlers. **Never create `new PrismaClient()` inside route handlers**.

### Safe Migration Procedure
```bash
# 1. Test migration locally against a shadow database
npx prisma migrate dev --name <migration_name>

# 2. In CI/CD or deployment pipeline, apply migrations using DIRECT_URL (port 5432)
DIRECT_URL=$DIRECT_URL npx prisma migrate deploy
```

---

## 4. Zero-Downtime Deployment Sequence

### Pre-Deployment Verification
```bash
# 1. Verify code formatting and linting
npm run lint

# 2. Verify TypeScript strict typing
npm run typecheck

# 3. Run full automated unit & security test suite
npm test

# 4. Verify optimized production bundle build
npm run build
```

### Staging Deployment Gate
1. Deploy build artifact to staging environment (`staging.trendstreet.in`).
2. Run end-to-end integration tests:
   ```bash
   npm run test:integrations
   ```
3. Test dummy payment flow with Razorpay test cards (4012 0000 0000 0002).
4. Verify Shiprocket sandbox order booking and mock tracking generation.

### Production Promotion
1. Verify database schema is in sync (`npx prisma migrate status`).
2. Promote staging build to production.
3. Confirm health check endpoint returns 200 OK:
   ```bash
   curl -I https://trendstreet.in/api/products
   ```
4. Verify security headers in response:
   - `strict-transport-security: max-age=63072000; includeSubDomains; preload`
   - `x-content-type-options: nosniff`
   - `x-frame-options: DENY`
   - `content-security-policy: default-src 'self' ...`

---

## 5. Rollback & Incident Recovery

### Instant Rollback
- In Vercel / Cloudflare: Navigate to **Deployments** > Select the last healthy deployment > Click **Instant Rollback**.
- In Docker / Kubernetes: Revert image tag to previous stable digest (`trendstreet:v1.0.x-stable`).

### Payment Gateway Circuit Breaker
If anomalous payment failures or webhook timeouts occur:
1. Verify Razorpay dashboard API health status.
2. If webhooks are failing, Razorpay automatically retries up to 24 hours. The durable `AuditLog` in Trend Street safely absorbs all duplicate attempts without double-crediting.
3. To temporarily enforce test mode, update environment variable:
   ```bash
   ALLOW_LIVE_PAYMENTS="false"
   ```
   and redeploy.
