# SARAL — Setup Guide

This guide assumes you already have:
- **PostgreSQL 18** installed locally (via pgAdmin)
- **SaralDB** database created in pgAdmin
- **Node.js 18+** installed
- **Docker Desktop** installed (for MinIO + Redis)

## Architecture

```
LOCAL DEVELOPMENT
                         +-------------+
   Browser   ----------> | Next.js App |
                         | (port 3000) |
                         +-------------+
                          |     |     |
                          v     v     v
              +-----------+ +-------+ +-------+
              | Postgres  | | MinIO | | Redis |
              |  (LOCAL,  | |(Docker| |(Docker|
              |  port 5432| | 9000) | | 6379) |
              | SaralDB)  | +-------+ +-------+
              +-----------+

PRODUCTION (AWS) - same code, just env changes
              +-----------+ +-------+ +-----------+
              |  AWS RDS  | |AWS S3 | |ElastiCache|
              +-----------+ +-------+ +-----------+
```

---

## One-Time Setup

### Step 1: Create database user in pgAdmin

Open `scripts/setup-database.sql` and run it in pgAdmin in **two parts**:

**PART 1** (run in `postgres` database):
1. In pgAdmin, expand: PostgreSQL 18 -> Databases -> **postgres**
2. Right-click on `postgres` -> Query Tool
3. Copy-paste **PART 1** from `scripts/setup-database.sql`
4. Press **F5** to execute
5. Should see message: "User saral created successfully"

**PART 2** (run in `SaralDB` database):
1. In pgAdmin, expand: PostgreSQL 18 -> Databases -> **SaralDB**
2. Right-click on `SaralDB` -> Query Tool
3. Copy-paste **PART 2** from `scripts/setup-database.sql`
4. Press **F5** to execute
5. Should see schema owner set to `saral`

After both parts:
- User `saral` exists with password `postgres`
- `saral` owns the `public` schema in `SaralDB`
- Prisma can now create tables here

### Step 2: Install Node.js dependencies

```bash
npm install
```

This installs Next.js, Prisma, AWS SDK, etc. (~3-5 minutes).

### Step 3: Start Docker services (MinIO + Redis)

Make sure **Docker Desktop is running** (whale icon in system tray).

```bash
npm run services:up
```

This starts:
- **MinIO** on port `9000` (API) and `9001` (web console)
- **Redis** on port `6379`

Verify with:
```bash
docker compose ps
```

You should see 2 containers running.

### Step 4: Create database tables (Prisma)

```bash
npm run db:push
```

This reads `prisma/schema.prisma` and creates these tables in `SaralDB`:
- `users`
- `videos`
- `likes`
- `comments`
- `subscriptions`

### Step 5: Seed sample data

```bash
npm run db:seed
```

This loads sample videos and shorts into the database. If you had old `data/videos.json`, it imports from there.

### Step 6: Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - SARAL should be live!

---

## Daily Workflow (After Setup)

Whenever you want to work on SARAL:

```bash
# 1. Start Docker services (if not already running)
npm run services:up

# 2. Make sure pgAdmin's PostgreSQL service is running on your machine
#    (Usually starts automatically on Windows boot)

# 3. Start dev server
npm run dev
```

That's it. Code changes hot-reload automatically.

---

## Useful Commands

### Service management
```bash
npm run services:up      # Start MinIO + Redis
npm run services:down    # Stop them
npm run services:logs    # See live logs
```

### Database
```bash
npm run db:studio        # Visual database explorer (web UI)
npm run db:push          # Apply schema changes
npm run db:seed          # Re-seed sample data
```

### Access dashboards
- **App:** [http://localhost:3000](http://localhost:3000)
- **MinIO console:** [http://localhost:9001](http://localhost:9001)
  - User: `saral_minio_admin`
  - Pass: `saral_minio_password`
- **Database UI:** `npm run db:studio` -> opens browser
- **pgAdmin:** Already installed - use to inspect SaralDB

---

## Troubleshooting

### "P1001: Can't reach database server at localhost:5432"

PostgreSQL service is not running. Open Windows Services:
1. Press `Win + R`, type `services.msc`
2. Find "postgresql-x64-18" (or similar)
3. Right-click -> Start

### "permission denied for schema public"

PART 2 of the SQL script wasn't run, or was run in wrong database.
- Make sure you ran PART 2 while connected to **SaralDB** (not postgres)
- Re-run PART 2 from `scripts/setup-database.sql`

### "database SaralDB does not exist"

The database name might be lowercase. Try:
1. In pgAdmin, check the exact spelling
2. If it shows as `saraldb` (lowercase), update `.env`:
   ```
   DATABASE_URL="postgresql://saral:postgres@localhost:5432/saraldb?schema=public"
   ```

### Docker says "Cannot connect to Docker daemon"

Docker Desktop is not running. Start it from Windows Start menu.

### MinIO upload fails

Check buckets at [http://localhost:9001](http://localhost:9001). If `saral-videos` and `saral-thumbnails` buckets don't exist:
```bash
npm run services:down
npm run services:up
```
The setup container will recreate buckets.

### Port 9000 already in use

Another service is using port 9000. Either stop it or change MinIO port in `docker-compose.yml`.

### Hot reload not picking up changes
Stop dev server (Ctrl+C) and restart with `npm run dev`.

---

## File Structure

```
Saral/
├── docker-compose.yml          # MinIO + Redis services
├── .env                        # Local config (PostgreSQL + MinIO + Redis URLs)
├── .env.example                # Template with AWS production examples
├── prisma/
│   └── schema.prisma           # Database schema
├── scripts/
│   ├── setup-database.sql      # Run in pgAdmin to create user 'saral'
│   └── seed-db.ts              # Load sample data into PostgreSQL
├── src/
│   ├── lib/
│   │   ├── prisma.ts           # Prisma client
│   │   ├── db.ts               # Database operations
│   │   ├── storage.ts          # S3/MinIO file uploads
│   │   └── limits.ts           # Upload limits
│   ├── pages/                  # All Next.js pages and API routes
│   └── components/             # React components
└── data/                       # OLD: JSON files (kept for migration reference)
```

---

## Moving to AWS (Production)

When ready to deploy:

### 1. Set up AWS resources
- **AWS RDS PostgreSQL** (db.t3.micro, free tier eligible 12 months)
- **AWS S3** - 2 buckets: `saral-videos-prod`, `saral-thumbnails-prod`
- **AWS ElastiCache Redis** (cache.t3.micro)

### 2. Update environment variables on your hosting platform

Open `.env.example` - it has production examples. Copy these to your deployment platform (Vercel, Railway, AWS App Runner, etc.):

```bash
DATABASE_URL="postgresql://saral:STRONG_PASSWORD@your-rds-endpoint:5432/saral"
REDIS_URL="redis://your-elasticache-endpoint:6379"

S3_ENDPOINT=""                     # Empty = use real AWS S3
S3_REGION="ap-south-1"             # Mumbai
S3_ACCESS_KEY_ID="AKIA..."
S3_SECRET_ACCESS_KEY="..."
S3_BUCKET_VIDEOS="saral-videos-prod"
S3_BUCKET_THUMBNAILS="saral-thumbnails-prod"
S3_FORCE_PATH_STYLE="false"
```

### 3. Deploy

```bash
# Push code to your platform (Vercel example)
vercel deploy --prod
```

### 4. Run migrations on production DB

```bash
DATABASE_URL="<prod-url>" npx prisma db push
DATABASE_URL="<prod-url>" npm run db:seed   # optional starter data
```

**That's it. Same code, just different .env.**

---

## What's Where (Quick Reference)

| Data | Where it lives | Production equivalent |
|------|----------------|----------------------|
| Users | PostgreSQL `users` table | AWS RDS |
| Video titles, metadata | PostgreSQL `videos` table | AWS RDS |
| Likes | PostgreSQL `likes` table | AWS RDS |
| Comments | PostgreSQL `comments` table | AWS RDS |
| Subscriptions | PostgreSQL `subscriptions` table | AWS RDS |
| Video files (MP4) | MinIO bucket `saral-videos` | AWS S3 bucket |
| Thumbnails | MinIO bucket `saral-thumbnails` | AWS S3 bucket |
| Counters cache | Redis (planned) | AWS ElastiCache |
| Sessions | Redis (planned) | AWS ElastiCache |

---

Happy coding! Local pe full production-grade architecture pe chal raha hai SARAL.
