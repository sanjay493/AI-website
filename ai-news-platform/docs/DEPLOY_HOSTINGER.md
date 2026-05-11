# Deploy on Hostinger (VPS) with GitHub Actions

This project runs **Next.js**, **FastAPI**, **PostgreSQL**, and **Redis** in Docker. That requires **a Hostinger VPS** (SSH + Docker), **not** standard shared / PHP‑only hosting.

---

## Before you start (checklist)

- [ ] A **GitHub repository** containing the `ai-news-platform` folder contents (Compose file at repo root).
- [ ] A **Hostinger VPS** plan (Linux, root or sudo SSH access).
- [ ] Two hostnames pointed at your server (recommended):
  - `yourdomain.com` → website (Next.js)
  - `api.yourdomain.com` → API (FastAPI)  
  (You can instead use paths on one hostname if you configure a reverse proxy yourself; the example env file assumes an API subdomain.)

---

## Part A — Hostinger (VPS)

### 1. Order and access the VPS

1. Log in to **Hostinger hPanel**.
2. Open **VPS** and create or select a VPS (Ubuntu 22.04 or 24.04 LTS works well).
3. Note the **IPv4 address** — you need it for DNS and GitHub `VPS_HOST`.
4. In Hostinger firewall / VPS security, allow inbound:
   - **22** (SSH)
   - **80** / **443** (HTTP/S for your reverse proxy or future TLS)

### 2. SSH into the server

From your computer:

```bash
ssh root@YOUR_VPS_IP
```

(Use whatever user Hostinger gives you instead of `root` if applicable.)

### 3. Install Docker and Docker Compose (plugin)

On the VPS:

```bash
apt-get update && apt-get install -y ca-certificates curl git
curl -fsSL https://get.docker.com | sh
```

Confirm:

```bash
docker compose version
```

You should see Compose v2 (e.g. `Docker Compose version v2.x`).

### 4. Clone your Git repository on the VPS

Pick a permanent folder (examples use `/opt/ai-news-platform`):

```bash
mkdir -p /opt && cd /opt
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git ai-news-platform
cd ai-news-platform
```

Replace with your actual clone URL (**HTTPS** requires a PAT or SSH key set up on the server for pulls; simplest for deploy is **`git clone` with SSH deploy key** — see GitHub notes in Part B).

### 5. Create production environment file

1. Copy the example:

```bash
cp .env.production.example .env.production
nano .env.production
```

2. Set **secure** values:

| Variable | What to put |
|---------|--------------|
| `POSTGRES_PASSWORD` | Long random password |
| `SECRET_KEY` | Random string for JWT (do not reuse dev values) |
| `NEXT_PUBLIC_SITE_URL` | Full public HTTPS URL of the website, e.g. `https://yourdomain.com` |
| `NEXT_PUBLIC_API_URL` | Full public HTTPS API URL, e.g. `https://api.yourdomain.com/api/v1` |
| `FRONTEND_BASE_URL` | Usually same site as Next, e.g. `https://yourdomain.com` |
| `CORS_ORIGINS` | Must include the browser origin (`https://yourdomain.com`; comma-separated if several) |
| `ALLOWED_HOSTS` | API hostnames only, comma-separated **without** `https://`, e.g. `api.yourdomain.com` |
| `FIRST_ADMIN_EMAIL` | Optional; email that gets admin on first signup |

3. Save the file and **never commit** `.env.production` to Git.

### 6. DNS in Hostinger (or wherever your domain DNS lives)

1. Add an **A record**: `yourdomain.com` → your VPS IPv4.
2. Add **`api`** (subdomain): `api.yourdomain.com` → same IPv4.

Wait for DNS propagation (often minutes to a few hours).

### 7. TLS and reverse proxy (required for HTTPS in production)

The Docker Compose file exposes app ports internally; browsers expect **HTTPS** on 443.

Pick one approach:

1. **Caddy or Nginx on the VPS** listening on **80** and **443**, proxying:
   - `yourdomain.com` → `127.0.0.1:3000` (Next)
   - `api.yourdomain.com` → `127.0.0.1:8000` (FastAPI)

2. **Cloudflare “orange cloud”** in front of the VPS with SSL mode **Full (strict)** if you terminate TLS locally with certificates.

Detailed proxy config depends on what you choose; the important rule is **public URLs in `.env.production`** must match what users and the browser hit.

---

## Part B — GitHub

### 1. Push the repo

1. Repo layout: Git root contains **`ai-news-platform/`** with `docker-compose.yml` inside it (use that folder for `VPS_DEPLOY_PATH`).
2. Push to **`main`** (or **`master`**), which matches our CI and deploy workflows.

### 2. Confirm CI passes

1. Open **GitHub → Actions**.
2. The **CI** workflow runs on push/PR to `main`/`master`.
3. Fix any failing **pytest** or **jest** checks before relying on deploy.

### 3. Add repository secrets for deploy

Go to **GitHub → your repo → Settings → Secrets and variables → Actions → New repository secret**.

Create these secrets:

| Secret name | Example / notes |
|-------------|-------------------|
| `VPS_HOST` | Your VPS IPv4 or hostname (`api.` host is wrong here — use the **server IP** or SSH hostname). |
| `VPS_USER` | SSH user, e.g. `root` or `ubuntu`. |
| `VPS_SSH_KEY` | **Private** key PEM (whole file contents, including `BEGIN`/`END`). |
| `VPS_DEPLOY_PATH` | Directory **on the server** that contains `docker-compose.yml` (e.g. `/opt/AI-website/ai-news-platform`). No trailing slash. |
| `VPS_REPO_PATH` | *(Optional)* Git **repo root** (folder with `.git`), e.g. `/opt/AI-website`. Omit if compose lives at repo root (`VPS_REPO_PATH` = `VPS_DEPLOY_PATH`). |

Generate an SSH key pair **only for deploy**:

```bash
ssh-keygen -t ed25519 -f gh-deploy-hostinger -N ""
```

- Paste **`gh-deploy-hostinger.pub`** contents into **`~/.ssh/authorized_keys`** on the VPS for that user.
- Paste **`gh-deploy-hostinger`** **private** file contents into the **`VPS_SSH_KEY`** secret.

Ensure the VPS user can **`cd VPS_DEPLOY_PATH`**, **`git pull`**, and run **`docker compose`** **without sudo** (normally add user to **`docker`** group and re-login):

```bash
usermod -aG docker YOUR_USER
```

### 4. Give the VPS permission to pull the repo

GitHub allows public repo pulls without authentication. When deploy keys are needed

If your repo becomes private, then your server cannot do: git pull

- **Private repo**: add a **[Deploy key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys#deploy-keys)** (read-only) on GitHub Settings → Deploy keys → add the VPS’s **public** key, OR use HTTPS with a **PAT**.
- **Public repo**: `git clone` / `git pull` over HTTPS is enough.

### 5. Run the deploy workflow

1. **GitHub → Actions → “Deploy VPS (Hostinger)” → Run workflow**
2. Select branch **`main`** (or **`master`**) → **Run**.

The job SSHs into the server, **`git pull`**, then builds and starts containers with:

`docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d --build`

### 6. Automatic deploy after CI

On **push** to **`main`** or **`master`**, when the **CI** workflow finishes successfully, **Deploy VPS (Hostinger)** runs automatically (`workflow_run` trigger).

You can still deploy manually anytime: **Actions → Deploy VPS (Hostinger) → Run workflow**.

---

## Part C — After deploy

1. **Smoke test**
   - Open `https://yourdomain.com` (home page).
   - Open `https://api.yourdomain.com/docs` only if **`DEBUG`** is temporarily true in prod (normally keep docs disabled in production).
2. Check containers on the VPS:

```bash
cd /opt/AI-website/ai-news-platform   # same as VPS_DEPLOY_PATH
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production ps
```

### Weekly “news agent” ingest (optional)

The stack can pull **RSS/Atom** sources (defaults include arXiv, Google AI blog, Google News AI topic, plus a curated YouTube channel feed) and optionally **YouTube regional trending** videos when **`YOUTUBE_API_KEY`** is set (YouTube Data API v3, `videos.list` with `chart=mostPopular`; default category **28** = Science & Technology). Items are stored as **`news`** posts (title, description snippet, link — not full video transcripts).

- **Manual:** Admin → **Run ingest now**.
- **Cron (no browser):** set **`NEWS_INGEST_CRON_SECRET`** in `.env.production`, then POST (same public URL you use for the API, often same host as the site with `/api/v1`):

```bash
curl -sS -X POST "https://yourdomain.com/api/v1/admin/news-agent/ingest/scheduled" \
  -H "Content-Type: application/json" \
  -H "X-News-Ingest-Secret: YOUR_SECRET_HERE" \
  -d '{}'
```

Example **weekly** (Monday 06:00 UTC): `0 6 * * 1` in `crontab` on the VPS.

---

## Troubleshooting

| Problem | Things to verify |
|---------|-------------------|
| GitHub Deploy fails at SSH | Secrets match your server; private key paired with `authorized_keys`; user can SSH manually. |
| `git pull` fails on VPS | Repo auth (deploy key or HTTPS token); repo URL correct. |
| `docker compose` permission denied | User in `docker` group; logout/login after `usermod`. |
| CORS errors in browser | `CORS_ORIGINS` includes exact site origin (`https://…`, no typo). |
| Next.js calls wrong API | `NEXT_PUBLIC_API_URL` in `.env.production` and **rebuilt** frontend image (`--build`). |
| 502 Bad Gateway via proxy | Upstream URLs and ports (**3000** / **8000**) match Compose; firewall allows loopback proxy. |

---

## Files in this repo that matter here

| File | Role |
|------|------|
| `.github/workflows/ci.yml` | Tests on push/PR |
| `.github/workflows/deploy-hostinger-vps.yml` | SSH deploy |
| `docker-compose.yml` | Base stack |
| `docker-compose.prod.yml` | Production overrides (merged with base) |
| `.env.production.example` | Template for server-only `.env.production` |

You are done when the **CI** workflow is green and a manual **Deploy VPS** run completes without errors, and your domain loads the site over HTTPS.
