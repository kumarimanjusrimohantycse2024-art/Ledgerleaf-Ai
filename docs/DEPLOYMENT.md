# 🚀 LedgerLeaf AI — Deployment Guide

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
- [Backend Deployment (Railway / Render)](#backend-deployment-railway--render)
- [Database Setup (PostgreSQL)](#database-setup-postgresql)
- [Environment Variables](#environment-variables)
- [Post-Deployment Verification](#post-deployment-verification)
- [Backup & Recovery](#backup--recovery)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring](#monitoring)

---

## Architecture Overview

```
┌─────────────────┐     HTTPS      ┌─────────────────┐     SQL       ┌──────────────┐
│   Vercel (CDN)  │ ─────────────▶ │  Railway/Render │ ────────────▶ │  PostgreSQL  │
│   Next.js 16    │ ◀───────────── │  FastAPI + Uvicorn │ ◀──────────── │  (Supabase)  │
│   Frontend      │    JSON API    │  Backend API     │              │  Database     │
└─────────────────┘                └─────────────────┘              └──────────────┘
```

---

## Frontend Deployment (Vercel)

### 1. Connect Repository
1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repository: `kumarimanjusrimohantycse2024-art/Ledgerleaf-Ai`
3. Set **Root Directory** to `frontend`
4. Framework: **Next.js** (auto-detected)

### 2. Environment Variables
Set the following in Vercel dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | Your backend URL (e.g., `https://ledgerleaf-api.up.railway.app`) |

### 3. Deploy
Click **Deploy**. Vercel will automatically:
- Install dependencies (`npm install`)
- Build the app (`npm run build`)
- Deploy to CDN with HTTPS

### 4. Custom Domain (Optional)
- Go to Settings → Domains
- Add your custom domain (e.g., `app.ledgerleaf.ai`)
- Configure DNS records as shown

---

## Backend Deployment (Railway / Render)

### Option A: Railway

1. Go to [railway.app](https://railway.app) → **New Project**
2. Select **Deploy from GitHub** → Choose your repo
3. Set **Root Directory** to `backend`
4. Add a **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (see [Environment Variables](#environment-variables))
6. Railway auto-detects Python and installs from `requirements.txt`

### Option B: Render

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repo
3. **Root Directory**: `backend`
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables

### Procfile (Alternative)
Create `backend/Procfile`:
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## Database Setup (PostgreSQL)

### Option A: Supabase (Recommended for MVP)
1. Create a project at [supabase.com](https://supabase.com)
2. Go to Settings → Database → Connection string
3. Use the **URI** format for `DATABASE_URL`

### Option B: Railway PostgreSQL
1. In your Railway project, click **+ New** → **Database** → **PostgreSQL**
2. Copy the `DATABASE_URL` from the Variables tab

### Option C: Local Development
SQLite is used automatically:
```
DATABASE_URL=sqlite+aiosqlite:///./ledgerleaf.db
```

### Database Initialization
The application uses SQLAlchemy with auto-creation. On first startup:
- Tables are created automatically via `Base.metadata.create_all()`
- No manual migration needed for initial setup

For production migrations with Alembic:
```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

---

## Environment Variables

### Backend (Required)
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://user:pass@host:5432/db` |
| `SECRET_KEY` | JWT signing key (64+ chars) | `openssl rand -hex 32` |
| `CORS_ORIGINS` | Allowed frontend origins | `https://ledgerleaf-ai.vercel.app` |
| `APP_ENV` | Environment | `production` |

### Backend (Optional)
| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | For AI assistant | Demo mode without it |
| `AI_MODEL` | OpenAI model | `gpt-4o` |
| `REDIS_URL` | Background jobs | Not required for MVP |

### Frontend
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |

---

## Post-Deployment Verification

### Health Check
```bash
curl https://your-backend-url.com/health
# Expected: {"status": "healthy", "version": "1.0.0"}
```

### API Docs
Visit `https://your-backend-url.com/docs` for the interactive Swagger UI.

### Smoke Test Checklist
- [ ] Landing page loads at frontend URL
- [ ] Registration form works
- [ ] Login returns JWT token
- [ ] Create organization succeeds
- [ ] Dashboard loads with empty data
- [ ] Create a test client
- [ ] Create a test invoice with line items
- [ ] Verify invoice totals are correct
- [ ] Record a payment
- [ ] AI assistant chat loads (demo mode)

---

## Backup & Recovery

### Database Backup (PostgreSQL)
```bash
# Automated daily backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql $DATABASE_URL < backup_20261021_120000.sql
```

### Supabase Backups
- Supabase provides automatic daily backups (Pro plan)
- Point-in-time recovery available on Pro plan
- Manual backup: Dashboard → Database → Backups

### Application Backup
```bash
# Export all data via API
curl -H "Authorization: Bearer $TOKEN" https://api.ledgerleaf.ai/api/v1/export > data.json
```

---

## Rollback Procedures

### Frontend (Vercel)
1. Go to Vercel Dashboard → Deployments
2. Find the previous working deployment
3. Click **...** → **Promote to Production**
4. Instant rollback, zero downtime

### Backend (Railway)
1. Go to Railway Dashboard → Deployments
2. Click on the previous deployment
3. Select **Redeploy** on the working version

### Database Rollback
```bash
# Revert last migration
cd backend
alembic downgrade -1

# Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD.sql
```

---

## Monitoring

### Health Endpoints
- `GET /health` — Application health check
- `GET /docs` — API documentation (Swagger)

### Recommended Tools
- **Uptime**: UptimeRobot or Better Uptime (free tier)
- **Error Tracking**: Sentry (free tier for 5k events/month)
- **Logs**: Railway/Render built-in log viewers
- **Performance**: Vercel Analytics (frontend)

### Setting Up Sentry (Optional)
```bash
pip install sentry-sdk[fastapi]
```
Add to `app/main.py`:
```python
import sentry_sdk
sentry_sdk.init(dsn="your-sentry-dsn", traces_sample_rate=0.1)
```

---

## Security Checklist for Production

- [ ] `SECRET_KEY` is a strong random value (not the default)
- [ ] `DEBUG=false` in production
- [ ] `CORS_ORIGINS` is set to your specific frontend domain only
- [ ] Database credentials are rotated regularly
- [ ] HTTPS is enforced (Vercel and Railway do this automatically)
- [ ] Rate limiting is configured
- [ ] `.env` file is never committed to git

---

## Known Limitations

1. **AI Assistant**: Works in demo mode without OpenAI key. Full AI requires `OPENAI_API_KEY`.
2. **File Storage**: Currently local filesystem. Production needs S3 or equivalent.
3. **Email**: SMTP not configured — invoice emails are logged, not sent.
4. **Billing**: Stripe integration is UI-only placeholder.
5. **Cash Flow**: Rule-based projections, not ML-based.

---

## Support

For issues, open a GitHub issue or contact the development team.
