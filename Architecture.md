Target Architecture
Frontend

Next.js

SEO pages
article pages
tutorial pages
search
newsletter signup
admin dashboard UI
Backend

FastAPI

APIs
scraping pipeline
AI summarization
authentication
article management
Database

PostgreSQL
(host via Supabase later)

Queue / Scheduler

Celery + Redis
(or simpler cron initially)

Deployment

Frontend → Vercel
Backend → Railway / Render
Alternative: VPS (e.g. Hostinger) + Docker + GitHub Actions — see docs/DEPLOY_HOSTINGER.md

Folder structure Cursor should build
ai-news-platform/
    frontend/
    backend/
    scraper/
    docs/