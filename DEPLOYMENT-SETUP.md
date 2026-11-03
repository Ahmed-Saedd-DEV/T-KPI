# Talabat KPI deployment setup

This kit adds a separate production runtime without replacing the existing development `docker-compose.yml`.

## 1. GitHub / GHCR
1. Add `.github/workflows/publish-backend.yml`.
2. Add the production Dockerfile and `.dockerignore` under `server/`.
3. Push the changes to `Fullstack-DEV`.
4. In GitHub Actions, confirm **Publish backend image** succeeds.
5. In GitHub Packages, open `t-kpi-backend` and set package visibility to **Public** if you want the second computer to pull without `docker login`.

The workflow publishes `latest` and a commit-SHA tag.

## 2. Second computer: production environment
1. Copy `server/.env.production.example` to `.env.production` in the repository root (same directory as `docker-compose.production.yml`).
2. Replace every placeholder. Use a long random URL-safe password containing only letters and numbers for `POSTGRES_PASSWORD`; put the same value in `DATABASE_URL`.
3. Set `JWT_SECRET` to a cryptographically random secret of at least 64 characters.
4. Set `CORS_ORIGINS` to the exact HTTPS origin of the deployed Cloudflare Pages site, e.g. `https://your-project.pages.dev`, without trailing slash.
5. Never commit `.env.production`.

Start:
```bash
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d
docker compose -f docker-compose.production.yml logs -f cloudflared
```
The cloudflared log prints a temporary `https://....trycloudflare.com` address.

## 3. Manual database setup
The production database volume is new and separate from development. Once the backend is healthy:
```bash
docker compose -f docker-compose.production.yml exec app npx prisma migrate deploy
docker compose -f docker-compose.production.yml exec -it app node scripts/bootstrap-admin.js
```
Migrations and initial admin creation are intentionally not run automatically.

## 4. Cloudflare Pages
Create a Pages project connected to this repository:
- Root directory: `public`
- Build command: `npm run build`
- Build output directory: `dist`
- Build environment variable: `VITE_API_URL=https://....trycloudflare.com`

Use the current Quick Tunnel URL. Redeploy Pages after changing this value.

## 5. Quick Tunnel limitation
The URL is temporary and may change after tunnel recreation or computer restart. Read it from `docker compose -f docker-compose.production.yml logs cloudflared`, update `VITE_API_URL` in Pages, and redeploy. Suitable for initial testing, not a stable production address.

## 6. Checks
```bash
docker compose -f docker-compose.production.yml ps
docker compose -f docker-compose.production.yml logs --tail=100 app
curl http://127.0.0.1:3001/health
```
API is bound locally on port `3001`; PostgreSQL and Redis only on localhost ports `54333` and `6380`.

## Notes
- Existing development `docker-compose.yml` is not replaced.
- Prisma schema and migration files are unchanged.
- Business logic, routes, JWT behavior, and API contracts are unchanged.
- Redis remains running with persistent storage; inspected backend package has no Redis client dependency, so this setup does not claim the API uses it.
- Existing `/auth/register` remains publicly reachable through the tunnel with current behavior. Review public self-registration before sharing broadly.
- GitHub Actions builds the backend image; Cloudflare Pages separately builds the frontend from `public/`.
