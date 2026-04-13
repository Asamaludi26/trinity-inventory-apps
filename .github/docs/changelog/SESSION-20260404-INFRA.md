# Session Log — 2026-04-04 (Part 2: Infrastructure)

**Session ID**: SESSION-20260404-INFRA  
**Date**: 4 April 2026  
**Agent Lead**: Opus 4.6  
**Branch**: `develop`  
**Focus**: Production-Grade Infrastructure Refactoring

---

## Ringkasan Eksekutif

Session ini melakukan **refactoring menyeluruh** pada seluruh infrastruktur deployment:

- Docker images (backend + frontend)
- Docker Compose orchestration
- Nginx reverse proxy + SSL
- CI/CD pipeline (GitHub Actions)

Tujuan utama: **production-ready, secure, scalable, efficient**.

---

## File yang Diubah / Dibuat

| File                           | Aksi         | Deskripsi                                   |
| ------------------------------ | ------------ | ------------------------------------------- |
| `backend/Dockerfile.example`   | **Refaktor** | Multi-stage build 4-layer, pisah prod-deps  |
| `backend/docker-entrypoint.sh` | **Baru**     | Entrypoint script untuk migration + startup |
| `frontend/Dockerfile.example`  | **Refaktor** | Multi-stage build, fix EXPOSE/HEALTHCHECK   |
| `frontend/nginx.conf`          | **Refaktor** | Simplified SPA fallback config              |
| `docker-compose.example.yml`   | **Refaktor** | Security hardening + resource limits        |
| `nginx/nginx.example.conf`     | **Refaktor** | Full production reverse proxy + SSL         |
| `.github/workflows/ci-cd.yml`  | **Refaktor** | Separated CI/CD + dual-env deploy           |

---

## 1. Backend Dockerfile (`backend/Dockerfile.example`)

### Masalah Sebelumnya

| Masalah                                                                                             | Dampak                                         |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Source code (`src/`, `scripts/`, `eslint.config.mjs`, `jest.config.js`) di-copy ke production image | Image bloat, expose kode sumber                |
| Install `dumb-init` AND `tini` (redundan)                                                           | Waste space                                    |
| `pnpm install --prod` tanpa `--frozen-lockfile`                                                     | Non-reproducible builds                        |
| `prisma generate` dijalankan 2x (builder + production)                                              | Build lambat                                   |
| CMD: `prisma generate && migrate deploy && db seed && (prisma studio & node main)`                  | Seed jalan setiap restart, generate di runtime |
| `PORT=${BACKEND_PORT}` di ENV                                                                       | Dockerfile tidak resolve env var saat build    |

### Arsitektur Baru (4-Stage)

```
base      → Node.js 20 Alpine + build tools (python3, make, g++)
  ├── deps      → Full dependency install (--frozen-lockfile)
  ├── prod-deps → Production-only dependencies (--prod --frozen-lockfile)
  └── builder   → TypeScript compile + Prisma generate
          ↓
production → node:20-alpine (NO build tools)
             ├── node_modules (from prod-deps, pre-compiled)
             ├── .prisma client (from builder, overlay)
             ├── dist/ (compiled JS only)
             ├── prisma/ (schema + migrations)
             └── docker-entrypoint.sh
```

### Key Changes

| Aspek           | Sebelum                             | Sesudah                         |
| --------------- | ----------------------------------- | ------------------------------- |
| Stages          | 3 (base, deps, builder, production) | 4 (+prod-deps terpisah)         |
| Production base | Includes pnpm                       | node:20-alpine saja             |
| Native modules  | Compiled at runtime                 | Pre-compiled in prod-deps       |
| Source code     | Copied to production                | NOT in production image         |
| Prisma generate | 2x (build + runtime)                | 1x (build only)                 |
| Seed            | Setiap restart                      | Opt-in via `RUN_SEED=true`      |
| Prisma Studio   | Selalu running                      | Opt-in via `PRISMA_STUDIO=true` |
| Entrypoint      | Inline shell command                | Proper entrypoint script        |
| pnpm workspace  | Missing frontend/e2e stubs          | Dummy packages created          |

---

## 2. Backend Entrypoint (`backend/docker-entrypoint.sh`) — BARU

Script terpisah yang menangani startup flow:

```
1. prisma migrate deploy  ← Selalu (idempotent)
2. prisma db seed          ← Hanya jika RUN_SEED=true
3. prisma studio           ← Hanya jika PRISMA_STUDIO=true (background)
4. node dist/src/main.js   ← Aplikasi utama (via exec → PID 1)
```

Keuntungan:

- `exec` memastikan Node.js menjadi PID 1 → graceful shutdown
- Seed tidak jalan setiap restart
- Prisma Studio optional (via env var)

---

## 3. Frontend Dockerfile (`frontend/Dockerfile.example`)

### Masalah yang Diperbaiki

| Masalah                                                                 | Fix                                         |
| ----------------------------------------------------------------------- | ------------------------------------------- |
| `LABEL APP=$(VITE_APP_NAME)` — shell syntax tidak bekerja di Dockerfile | Removed                                     |
| `EXPOSE ${FRONTEND_PORT}` — tidak resolve                               | `EXPOSE 80 443`                             |
| `HEALTHCHECK` ke `${FRONTEND_PORT}`                                     | Hardcode `127.0.0.1:80`                     |
| `pnpm install` tanpa `--frozen-lockfile`                                | Added                                       |
| Baked `nginx/nginx.conf` (full reverse proxy) ke image                  | Baked `frontend/nginx.conf` (SPA sederhana) |
| Missing workspace stubs                                                 | Dummy backend/e2e packages                  |

### Nginx Config Layering

```
Layer 1 (baked into image):
  frontend/nginx.conf → /etc/nginx/conf.d/default.conf
  ↳ Simple SPA: serve static files, /health, proxy /api to backend

Layer 2 (runtime mount via docker-compose):
  nginx/nginx.conf → /etc/nginx/nginx.conf (OVERRIDES Layer 1)
  ↳ Full reverse proxy: SSL, rate limiting, security headers, Prisma Studio
```

---

## 4. Docker Compose (`docker-compose.example.yml`)

### Security Hardening

| Service      | Sebelum                   | Sesudah                   |
| ------------ | ------------------------- | ------------------------- |
| PostgreSQL   | Port 5432 exposed ke host | Internal only             |
| Redis        | Port 6379 exposed ke host | Internal only             |
| Backend      | Port 3001 + 5555 exposed  | Internal only (via Nginx) |
| All services | No `security_opt`         | `no-new-privileges: true` |

### Resource Limits

| Service        | Memory | CPU |
| -------------- | ------ | --- |
| PostgreSQL     | 512M   | 1.0 |
| Redis          | 256M   | 0.5 |
| Backend        | 1G     | 2.0 |
| Frontend/Nginx | 256M   | 1.0 |
| Prometheus     | 256M   | 0.5 |
| Grafana        | 256M   | 0.5 |

### Redis Optimization

```yaml
command: >
  redis-server
  --maxmemory 256mb
  --maxmemory-policy allkeys-lru  # Auto-evict least recently used
  --tcp-backlog 511
  --timeout 300                    # Close idle connections
```

### Logging

Semua service menggunakan `json-file` driver dengan rotasi:

- Backend: 50MB × 5 files = max 250MB
- DB/Redis/Frontend: 10-20MB × 3-5 files

### Monitoring (Aktif kembali)

Prometheus + Grafana tidak lagi di-comment, tersedia via profile:

```bash
docker compose --profile monitor up -d
```

---

## 5. Nginx Configuration

### `nginx/nginx.example.conf` — Production Template

| Feature          | Detail                                                           |
| ---------------- | ---------------------------------------------------------------- |
| HTTPS            | TLS 1.2 + 1.3, modern cipher suite                               |
| HSTS             | `max-age=31536000; includeSubDomains; preload`                   |
| Rate Limiting    | API: 30r/s burst 50, Login: 5r/m burst 3                         |
| SSE Support      | `proxy_buffering off`, 24h timeout                               |
| Prisma Studio    | Password-protected, URL rewrite via `sub_filter`                 |
| Swagger Docs     | Password-protected via basic auth                                |
| Security Headers | CSP, X-Frame-Options, X-Content-Type-Options, Permissions-Policy |
| Static Assets    | 1 year cache, `immutable` header                                 |
| SPA Routing      | `try_files $uri $uri/ /index.html`                               |
| ACME Challenge   | Let's Encrypt webroot passthrough                                |
| Placeholder      | `YOUR_DOMAIN` — replace with actual domain                       |

### Setup Guide

```bash
# 1. Copy template
cp nginx/nginx.example.conf nginx/nginx.conf

# 2. Replace domain
sed -i 's/YOUR_DOMAIN/dev.tmi.net.id/g' nginx/nginx.conf    # Dev
sed -i 's/YOUR_DOMAIN/logistik.tmi.net.id/g' nginx/nginx.conf  # Prod

# 3. Create htpasswd
htpasswd -c nginx/.htpasswd admin

# 4. SSL certificate (Let's Encrypt)
docker compose --profile certbot run --rm certbot certonly \
  --webroot -w /var/www/certbot -d dev.tmi.net.id

# 5. Or self-signed for testing
openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/CN=dev.tmi.net.id"
```

---

## 6. CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

### Arsitektur Pipeline

```
                    ┌─ lint ──────────────┐
                    ├─ typecheck ─────────┤
push/PR ──────────► ├─ backend-tests ─────├──► quality-gate ──►┬─ deploy-dev  (develop)
                    ├─ frontend-tests ────┤                    └─ deploy-prod (main)
                    ├─ build (after lint) ─┤
                    └─ migrations ────────┘
```

### Perubahan dari Sebelumnya

| Aspek              | Sebelum                        | Sesudah                                         |
| ------------------ | ------------------------------ | ----------------------------------------------- |
| Deploy location    | Di dalam `summary` job         | Job terpisah per environment                    |
| SSH setup          | Tidak ada private key setup    | Proper key injection + cleanup                  |
| pnpm version       | `pnpm/action-setup@v2`         | `@v4` (latest)                                  |
| Dependency caching | Tidak ada                      | `cache: pnpm` di setup-node                     |
| Concurrency        | Tidak ada                      | `cancel-in-progress: true`                      |
| Deploy trigger     | Selalu (bahkan di PR)          | Hanya push ke branch target                     |
| Dev deploy         | Tidak ada pemisahan            | Push `develop` → dev.tmi.net.id                 |
| Prod deploy        | Tidak ada pemisahan            | Push `main` → logistik.tmi.net.id               |
| rsync exclusions   | Minimal                        | Exclude `.env`, `ssl/`, `uploads/`, `coverage/` |
| Post-deploy        | Tidak ada verifikasi           | Health check frontend + backend                 |
| Secrets            | `VM_HOST`, `VM_USER` (satu VM) | Terpisah `DEV_*` dan `PROD_*`                   |

### Required GitHub Secrets

```
SSH_PRIVATE_KEY           # SSH private key untuk akses kedua VM

# Development VM (dev.tmi.net.id / 103.91.148.122)
DEV_VM_HOST               # 103.91.148.122
DEV_VM_USER               # SSH username
DEV_VM_SSH_PORT            # SSH port (default: 22)
DEV_VM_DEPLOY_PATH         # Path di VM (e.g., /opt/trinity)

# Production VM (logistik.tmi.net.id / 103.91.148.125)
PROD_VM_HOST               # 103.91.148.125
PROD_VM_USER               # SSH username
PROD_VM_SSH_PORT            # SSH port (default: 22)
PROD_VM_DEPLOY_PATH         # Path di VM
```

### GitHub Environments (Opsional tapi Direkomendasikan)

Buat di GitHub → Settings → Environments:

1. **development** — auto-deploy, no approval needed
2. **production** — require manual approval dari reviewer

---

## Deployment Checklist

### First-Time Setup di VM

```bash
# 1. Clone repository
git clone https://github.com/Asamaludi26/TrinityInventoryApps.git
cd TrinityInventoryApps

# 2. Copy environment file
cp .env.example .env
nano .env  # Edit semua values

# 3. Setup Nginx config
cp nginx/nginx.example.conf nginx/nginx.conf
# Edit YOUR_DOMAIN sesuai environment

# 4. Create htpasswd
htpasswd -c nginx/.htpasswd admin

# 5. Setup SSL
# Self-signed (temporary):
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem -out nginx/ssl/fullchain.pem

# 6. First deploy
docker compose build
RUN_SEED=true docker compose up -d  # Seed on first run

# 7. Verify
docker compose ps
curl -sf https://YOUR_DOMAIN/health
```

---

## Catatan Teknis

1. **`pnpm workspace stubs`**: Backend dan Frontend Dockerfile membuat dummy `package.json` untuk package workspace yang tidak di-build, agar `pnpm install --frozen-lockfile` berhasil
2. **`--frozen-lockfile`**: Memastikan lockfile match → reproducible builds
3. **Prisma generate hanya 1x**: Di builder stage, hasilnya di-overlay ke production `node_modules/.prisma`
4. **Backend port tidak exposed**: Nginx reverse proxy menangani semua traffic → mengurangi attack surface
5. **`no-new-privileges`**: Mencegah privilege escalation di dalam container
