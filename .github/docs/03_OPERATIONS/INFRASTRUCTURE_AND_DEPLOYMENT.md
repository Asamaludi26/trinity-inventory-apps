# Infrastructure & Deployment Playbook

**Versi**: 1.0
**Tanggal**: 10 April 2026
**Referensi**: PRD v3.1 (NFR-05, NFR-07), SDD v3.1 (Bagian 3.4)
**Status**: ACTIVE

---

## 1. Arsitektur Infrastruktur

### 1.1 Topologi Container

```mermaid
graph TB
    classDef client fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#000
    classDef proxy fill:#fff3cd,stroke:#ffc107,stroke-width:2px,color:#000
    classDef app fill:#d4edda,stroke:#28a745,stroke-width:2px,color:#000
    classDef data fill:#f8d7da,stroke:#dc3545,stroke-width:2px,color:#000
    classDef monitor fill:#e2e3e5,stroke:#6c757d,stroke-width:2px,color:#000

    USER[Browser / Client]:::client

    subgraph Docker Network: trinity-net
        NGINX[Nginx Reverse Proxy<br/>Port 80/443]:::proxy
        FE[Frontend Container<br/>React + Nginx<br/>Port 80 internal]:::app
        BE[Backend Container<br/>NestJS<br/>Port 3001]:::app
        DB[(PostgreSQL 16<br/>Port 5432)]:::data
        REDIS[(Redis 7<br/>Port 6379)]:::data
        PROM[Prometheus<br/>Port 9090]:::monitor
        GRAF[Grafana<br/>Port 3100]:::monitor
    end

    USER -->|HTTPS 443| NGINX
    NGINX -->|/| FE
    NGINX -->|/api/*| BE
    NGINX -->|/uploads/*| BE
    BE --> DB
    BE --> REDIS
    PROM -->|:3001/api/v1/metrics| BE
    GRAF --> PROM
```

### 1.2 Container Specifications

| Container            | Base Image           | Memory Limit | Port | Health Check                  | Profile   |
| -------------------- | -------------------- | ------------ | ---- | ----------------------------- | --------- |
| **trinity-db**       | `postgres:16-alpine` | 512 MB       | 5432 | `pg_isready -U $USER`         | default   |
| **trinity-redis**    | `redis:7-alpine`     | 256 MB       | 6379 | `redis-cli --pass $PASS ping` | default   |
| **trinity-backend**  | Custom (Node 22)     | 1 GB         | 3001 | `GET /api/v1/health`          | default   |
| **trinity-frontend** | Custom (Nginx 1.27)  | 256 MB       | 80   | `curl -f http://localhost:80` | default   |
| **prisma-studio**    | Reuses backend image | 512 MB       | 5555 | —                             | `admin`   |
| **prometheus**       | `prom/prometheus`    | 256 MB       | 9090 | —                             | `monitor` |
| **grafana**          | `grafana/grafana`    | 256 MB       | 3100 | —                             | `monitor` |

### 1.3 Docker Volumes (Persistent Data)

| Volume            | Mount Point (Container)    | Deskripsi                     |
| ----------------- | -------------------------- | ----------------------------- |
| `postgres_data`   | `/var/lib/postgresql/data` | Database files PostgreSQL     |
| `redis_data`      | `/data`                    | Redis AOF persistence         |
| `backend_uploads` | `/app/uploads`             | File attachment (gambar, PDF) |
| `grafana_data`    | `/var/lib/grafana`         | Grafana dashboards & settings |

### 1.4 Docker Logging Configuration

| Container  | Driver    | Max Size | Max Files | Total Max |
| ---------- | --------- | -------- | --------- | --------- |
| PostgreSQL | json-file | 10 MB    | 3         | 30 MB     |
| Redis      | json-file | 10 MB    | 3         | 30 MB     |
| Backend    | json-file | 50 MB    | 5         | 250 MB    |
| Frontend   | json-file | 20 MB    | 5         | 100 MB    |

---

## 2. Environment Configuration

### 2.1 Environment Stages

| Stage           | Tujuan                        | Domain / URL             | Auto-Deploy |
| --------------- | ----------------------------- | ------------------------ | ----------- |
| **Development** | Testing harian oleh developer | `http://localhost:5173`  | —           |
| **Staging/Dev** | Testing di VM sebelum UAT     | `https://dev.domain.com` | ✅ (CI/CD)  |
| **Production**  | Live untuk end-user           | `https://app.domain.com` | Manual      |

### 2.2 Environment Variables per Stage

#### 2.2.1 Development (Local)

```bash
# .env (local development)
NODE_ENV=development
TAG=latest

# Database
POSTGRES_USER=trinity_dev
POSTGRES_PASSWORD=dev_password_local
POSTGRES_DB=trinity_dev_db
POSTGRES_PORT=5432
DATABASE_URL=postgresql://trinity_dev:dev_password_local@localhost:5432/trinity_dev_db?schema=public

# Redis
REDIS_PASSWORD=dev_redis_local

# JWT
JWT_SECRET=dev-local-secret-minimum-64-characters-for-security-purposes-change-in-production
JWT_EXPIRES_IN=7d

# CORS & Frontend
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# Backend
LOG_LEVEL=debug
THROTTLE_TTL=60
THROTTLE_LIMIT=1000
SWAGGER_ENABLED=true

# Prisma
PRISMA_STUDIO=true

# Frontend Vite
VITE_API_URL=/api/v1
VITE_BASE_PATH=/
VITE_APP_NAME=Trinity Inventory Apps (DEV)
VITE_APP_VERSION=0.1.0-dev
VITE_USE_MOCK=false
VITE_ENABLE_DEBUG=true
VITE_LOG_LEVEL=debug

# WhatsApp (disabled di dev)
WA_ENABLED=false
```

#### 2.2.2 Staging (Dev VM)

```bash
NODE_ENV=production
TAG=latest

# Database — gunakan password kuat
POSTGRES_USER=trinity_logistik
POSTGRES_PASSWORD=<GENERATED_STRONG_PASSWORD>
POSTGRES_DB=trinity_logistik_db
POSTGRES_PORT=5432
DATABASE_URL=postgresql://trinity_logistik:<PASSWORD>@trinity-db:5432/trinity_logistik_db?schema=public

# Redis
REDIS_PASSWORD=<GENERATED_STRONG_PASSWORD>

# JWT — generate dengan: openssl rand -base64 64
JWT_SECRET=<GENERATED_64_CHAR_SECRET>
JWT_EXPIRES_IN=1d

# CORS & Frontend
CORS_ORIGIN=https://dev.domain.com
FRONTEND_URL=https://dev.domain.com

# Backend
LOG_LEVEL=info
THROTTLE_TTL=60
THROTTLE_LIMIT=100
SWAGGER_ENABLED=true    # Aktif untuk testing

# Prisma
PRISMA_STUDIO=false

# Frontend
VITE_API_URL=/api/v1
VITE_BASE_PATH=/
VITE_APP_NAME=Trinity Inventory Apps (STAGING)
VITE_APP_VERSION=0.1.0

# Monitoring
GRAFANA_PASSWORD=<STRONG_GRAFANA_PASSWORD>
```

#### 2.2.3 Production

```bash
NODE_ENV=production
TAG=<SPECIFIC_VERSION_TAG>

# Database
POSTGRES_USER=trinity_logistik
POSTGRES_PASSWORD=<PRODUCTION_STRONG_PASSWORD>
POSTGRES_DB=trinity_logistik_db
DATABASE_URL=postgresql://...@trinity-db:5432/trinity_logistik_db?schema=public

# JWT
JWT_SECRET=<PRODUCTION_64_CHAR_SECRET>
JWT_EXPIRES_IN=1d

# CORS — hanya domain production
CORS_ORIGIN=https://app.domain.com

# Backend — disable debug
LOG_LEVEL=warn
SWAGGER_ENABLED=false     # WAJIB disabled di production
PRISMA_STUDIO=false       # WAJIB disabled di production

# WhatsApp
WA_ENABLED=true
WA_API_URL=https://api.whatsapp-provider.com
WA_API_KEY=<WA_KEY>
WA_API_SECRET=<WA_SECRET>

# Frontend
VITE_ENABLE_DEBUG=false
VITE_LOG_LEVEL=warn
```

### 2.3 Perbedaan Kunci Antar Stage

| Konfigurasi         | Development | Staging        | Production  |
| ------------------- | ----------- | -------------- | ----------- |
| `NODE_ENV`          | development | production     | production  |
| `LOG_LEVEL`         | debug       | info           | warn        |
| `SWAGGER_ENABLED`   | true        | true           | **false**   |
| `PRISMA_STUDIO`     | true        | false          | **false**   |
| `JWT_EXPIRES_IN`    | 7d          | 1d             | 1d          |
| `THROTTLE_LIMIT`    | 1000        | 100            | 100         |
| `CORS_ORIGIN`       | localhost   | staging domain | prod domain |
| `WA_ENABLED`        | false       | false          | true        |
| `VITE_ENABLE_DEBUG` | true        | false          | **false**   |
| SSL/TLS             | ❌          | ✅             | ✅          |

---

## 3. Docker Build Strategy

### 3.1 Backend Dockerfile (Multi-Stage)

```
Stage 1: base          → Node 22-alpine + build tools + pnpm
Stage 2: deps          → Install semua dependencies (dev + prod) dengan cache mount
Stage 3: builder       → Transpile TypeScript + Generate Prisma Client + Build
Stage 4: deploy        → Extract hanya production dependencies
Stage 5: production    → Minimal runtime image (~100MB)
  - Non-root user: trinity:trinity
  - Health check: wget --spider http://localhost:3001/api/v1/health
  - Volume: /app/uploads (persistent)
  - Entrypoint: docker-entrypoint.sh
```

### 3.2 Frontend Dockerfile (Multi-Stage)

```
Stage 1: base          → Node 22-alpine + pnpm
Stage 2: deps          → Install dependencies
Stage 3: builder       → Vite production build (dengan build args untuk env)
Stage 4: production    → Nginx 1.27-alpine serving static files (~30MB)
  - Custom nginx.conf untuk SPA routing
  - Static asset caching (1 year, immutable)
```

### 3.3 Docker Entrypoint (Backend)

Urutan eksekusi saat backend container start:

```bash
1. Wait for Database    → TCP check ke port 5432 (max 30 retries, 2s interval)
2. Run Migrations       → prisma migrate deploy (idempotent)
3. Seed (optional)      → Jika RUN_SEED=true, jalankan prisma db seed
4. Prisma Studio (opt)  → Jika PRISMA_STUDIO=true, start di port 5555
5. Start Application    → node dist/src/main.js
```

---

## 4. Nginx Configuration

### 4.1 Production HTTPS Configuration

| Fitur                   | Konfigurasi                                                       |
| ----------------------- | ----------------------------------------------------------------- |
| **SSL/TLS**             | TLS 1.2 & 1.3, HSTS (max-age=31536000)                            |
| **Rate Limiting: API**  | 30 requests/second per IP                                         |
| **Rate Limiting: Auth** | 5 requests/minute per IP (login endpoint)                         |
| **Security Headers**    | CSP, X-Frame-Options: SAMEORIGIN, X-Content-Type-Options: nosniff |
| **Gzip Compression**    | Level 6 (text, CSS, JS, JSON, fonts)                              |
| **Client Body Size**    | Max 20 MB (file uploads)                                          |
| **Proxy Timeouts**      | Connect: 60s, Send: 60s, Read: 300s                               |
| **Keepalive**           | 32 connections ke backend upstream                                |
| **Connection Limit**    | 100 concurrent per IP                                             |

### 4.2 Routing Rules

| Path             | Target          | Keterangan                         |
| ---------------- | --------------- | ---------------------------------- |
| `/`              | Frontend (SPA)  | `try_files $uri $uri/ /index.html` |
| `/api/*`         | Backend (:3001) | Reverse proxy dengan rate limiting |
| `/uploads/*`     | Backend (:3001) | Static file serving                |
| `/prisma-studio` | Backend (:5555) | Password-protected (staging only)  |
| `/.well-known/`  | Certbot ACME    | SSL certificate renewal            |

### 4.3 SSL Certificate Management

```bash
# Initial certificate (Let's Encrypt)
certbot certonly --webroot -w /var/www/certbot -d app.domain.com

# Auto-renewal via Docker profile 'certbot'
# docker-compose --profile certbot up certbot
# Cron job: 0 0 1 * * docker compose --profile certbot up certbot
```

---

## 5. Deployment Procedures

### 5.1 Development (Local)

```bash
# 1. Clone repository
git clone https://github.com/Asamaludi26/TrinityInventoryApps.git
cd TrinityInventoryApps

# 2. Install dependencies
pnpm install

# 3. Setup environment
cp .env.example .env
# Edit .env dengan konfigurasi local

# 4. Start dengan Docker
pnpm docker:up          # Start semua services
pnpm docker:admin       # Dengan Prisma Studio
pnpm docker:dev         # Development mode (hot reload)

# 5. Atau tanpa Docker (frontend + backend terpisah)
pnpm dev                # Run frontend + backend in parallel

# 6. Database tools
pnpm db:studio          # Prisma Studio (port 5555)
pnpm db:migrate         # Create migration
pnpm db:seed            # Seed data awal
```

### 5.2 Staging Deployment (Automated via CI/CD)

Deployment otomatis terjadi saat push ke branch `develop`:

```
1. CI/CD pipeline build Docker images → push ke GHCR
2. SSH ke VM deployment
3. Transfer konfigurasi (docker-compose, nginx)
4. Generate .env dari GitHub Secrets
5. Pull latest images dari GHCR
6. Verify database credentials
7. Start containers dengan urutan: db → redis → backend → frontend
8. Health check (exponential backoff)
9. Verify semua containers running
```

### 5.3 Production Deployment (Manual)

> **⚠️ PENTING**: Production deployment dilakukan secara manual untuk memastikan control dan safety.

```bash
# 1. SSH ke production server
ssh -p 2222 deploy@prod-server

# 2. Navigate ke deployment directory
cd /opt/trinity

# 3. Backup database SEBELUM deploy (WAJIB)
./scripts/backup-db.sh

# 4. Pull images terbaru
docker compose pull

# 5. Rolling restart (zero-downtime jika memungkinkan)
docker compose up -d --no-deps backend
# Tunggu health check pass
docker compose up -d --no-deps frontend

# 6. Verify
docker compose ps
docker compose logs --tail=50 backend
curl -s https://app.domain.com/api/v1/health
```

### 5.4 Rollback Procedure

```bash
# 1. Identifikasi versi terakhir yang stabil
docker images | grep trinity

# 2. Rollback ke versi sebelumnya
export TAG=<previous-sha>
docker compose up -d

# 3. Jika perlu rollback database migration
# PERHATIAN: Hanya lakukan jika migrasi terakhir reversible
docker compose exec backend npx prisma migrate resolve --rolled-back <migration_name>

# 4. Restore dari backup jika diperlukan
# Lihat dokumen: DATABASE_MIGRATION_AND_BACKUP.md
```

---

## 6. Docker Compose Profiles

### 6.1 Profile Usage

```bash
# Default (core services)
docker compose up -d
# Starts: db, redis, backend, frontend

# Admin tools
docker compose --profile admin up -d
# Adds: prisma-studio (port 5555)

# Monitoring
docker compose --profile monitor up -d
# Adds: prometheus (port 9090), grafana (port 3100)

# SSL renewal
docker compose --profile certbot up certbot
# Runs: certbot container untuk renew SSL

# E2E testing
docker compose --profile e2e up -d
# Adds: cypress container

# Full stack (semua profile)
docker compose --profile admin --profile monitor up -d
```

---

## 7. Server Requirements

### 7.1 Minimum Hardware (Single Server)

| Resource | Development  | Staging    | Production              |
| -------- | ------------ | ---------- | ----------------------- |
| CPU      | 2 cores      | 2 cores    | 4 cores                 |
| RAM      | 4 GB         | 4 GB       | 8 GB                    |
| Storage  | 20 GB SSD    | 40 GB SSD  | 100 GB SSD              |
| Network  | —            | 100 Mbps   | 1 Gbps                  |
| OS       | Any (Docker) | Ubuntu 22+ | Ubuntu 22+ / Debian 12+ |

### 7.2 Software Requirements

| Software      | Versi Minimum | Catatan                       |
| ------------- | ------------- | ----------------------------- |
| Docker Engine | 24.0+         | Dengan Docker Compose v2      |
| Node.js       | 22 LTS        | Hanya untuk development lokal |
| pnpm          | 9.x           | Package manager               |
| Git           | 2.40+         | Version control               |
| OpenSSL       | 3.0+          | SSL certificate generation    |

### 7.3 Network & Firewall

| Port | Protocol | Source   | Tujuan                            |
| ---- | -------- | -------- | --------------------------------- |
| 80   | TCP      | Public   | HTTP → redirect ke HTTPS          |
| 443  | TCP      | Public   | HTTPS (Nginx)                     |
| 2222 | TCP      | CI/CD IP | SSH (hardened port)               |
| 5432 | TCP      | Internal | PostgreSQL (JANGAN expose public) |
| 6379 | TCP      | Internal | Redis (JANGAN expose public)      |
| 3001 | TCP      | Internal | Backend API (via Nginx)           |
| 9090 | TCP      | Internal | Prometheus (via Nginx/VPN)        |
| 3100 | TCP      | Internal | Grafana (via Nginx/VPN)           |

> **⚠️ KRITIS**: Port database (5432) dan Redis (6379) TIDAK BOLEH diexpose ke public. Akses hanya melalui Docker internal network.

---

## 8. Troubleshooting

### 8.1 Container Tidak Start

```bash
# Check logs
docker compose logs --tail=100 <service_name>

# Check container status
docker compose ps -a

# Restart specific service
docker compose restart <service_name>

# Full recreation
docker compose down
docker compose up -d
```

### 8.2 Backend Gagal Connect ke Database

```bash
# Verify database running
docker compose exec trinity-db pg_isready -U $POSTGRES_USER

# Check DATABASE_URL
docker compose exec backend env | grep DATABASE

# Manual database connection test
docker compose exec trinity-db psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1;"
```

### 8.3 Nginx 502 Bad Gateway

```bash
# Check backend health
curl http://localhost:3001/api/v1/health

# Check nginx upstream config
docker compose exec frontend cat /etc/nginx/conf.d/default.conf

# Restart backend
docker compose restart backend
```

### 8.4 Disk Space Issues

```bash
# Check Docker disk usage
docker system df

# Cleanup unused images, volumes, networks
docker system prune -a --volumes

# Check container logs size
du -sh /var/lib/docker/containers/*/
```
