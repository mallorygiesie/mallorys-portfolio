# Mallory's Portfolio — Monorepo

One repo, one frontend, many backends. The portfolio site is the product; each
side project's API is an independent service. A change to one service deploys
only that service (path-filtered CI/CD).

## Layout

```
apps/
├── web/            Next.js portfolio (static export). Contains ALL demo UIs
│                   (gift app, SiteRisk, mahjong). Deploys as one unit.
├── gift-api/       FastAPI backend for the "would Mallory like this?" gift app.
└── site-risk-api/  FastAPI backend for SiteRisk (geocode + multi-agent risk).
.github/workflows/  One deploy pipeline per app, filtered by path.
infra/              (reserved) infrastructure-as-code.
```

The frontend talks to each backend over HTTP using build-time URLs:

| Var | Points at | Used by |
| --- | --- | --- |
| `NEXT_PUBLIC_GIFT_APP_API` | gift-api | gift app demo |
| `NEXT_PUBLIC_SITE_RISK_API` | site-risk-api | SiteRisk address box |

> Note: these are `NEXT_PUBLIC_*`, so they are baked into the static export at
> build time. If they are wrong (or unset) the demos fall back to `localhost`
> and fail in production — this is the bug that broke the SiteRisk address box.

## Local development

```bash
# gift-api  (http://localhost:8000)
cd apps/gift-api && cp .env.example .env   # fill in Azure keys
python3 -m uvicorn main:app --reload --port 8000

# site-risk-api  (http://localhost:8002)
cd apps/site-risk-api && cp .env.example .env   # fill in Azure + FIRMS/AirNow keys
python3 -m uvicorn main:app --reload --port 8002

# web  (http://localhost:3000)
cd apps/web && cp .env.example .env.local   # optional; localhost defaults work
npm install && npm run dev
```

## Deployment model

| App | Target | Why |
| --- | --- | --- |
| `web` | Azure Static Web Apps (free tier) | static export, no server |
| `gift-api` | Azure Container App (scale-to-zero) | cheap when idle |
| `site-risk-api` | Azure Container App (scale-to-zero) | cheap when idle |

Each pipeline in `.github/workflows/` triggers only on its own `apps/<name>/**`
path, builds its image (APIs) or static bundle (web), and updates just that
target. Nothing else redeploys.

### One-time setup (per environment)

1. Container Apps environment + two apps (`gift-api`, `site-risk-api`) in RG
   `mallory-website`, images from ACR `mallorygiesie.azurecr.io`.
2. Static Web App for the portfolio; grab its deploy token.
3. GitHub repo secrets: `AZURE_CREDENTIALS`, `AZURE_STATIC_WEB_APPS_API_TOKEN`,
   `APPINSIGHTS_CONNECTION_STRING`; repo vars: `NEXT_PUBLIC_GIFT_APP_API`,
   `NEXT_PUBLIC_SITE_RISK_API`.
4. Set each backend's app settings (Azure OpenAI, Search, Raindrop, FIRMS,
   AirNow) on its Container App — see each app's `.env.example`.

## Splitting a project into its own GitHub repo (later)

You do NOT need separate repos to get independent deploys — the path filters
already give you that. But if you ever want one:

```bash
git subtree split --prefix apps/site-risk-api -b site-risk-only
# push that branch to a new empty repo
```

## Provenance

`apps/gift-api` was recovered from the live container image
(`mallorygiesie.azurecr.io/mallorygiesie:latest`) — the actual deployed code,
not a possibly-drifted repo copy. `apps/web` came from the Next.js portfolio
source. `apps/site-risk-api` came from the standalone terrain app (never
previously deployed).
