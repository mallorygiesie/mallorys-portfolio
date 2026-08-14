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

Everything runs on **Azure App Service** (Linux containers, plan
`mallorygiesie-plan`, B1 — Basic hosts multiple apps on one plan at no extra
plan cost). Images are built in ACR `mallorygiesie.azurecr.io`.

| Deployable | App Service | URL |
| --- | --- | --- |
| `web` + `gift-api` (one image) | `mallorygiesie` | https://mallorygiesie.azurewebsites.net |
| `site-risk-api` | `mallorygiesie-siterisk` | https://mallorygiesie-siterisk.azurewebsites.net |

The portfolio frontend and gift-api ship as a single image (see root
`Dockerfile`) so the site keeps its one public URL. SiteRisk is a separate
service the frontend calls cross-origin.

Each pipeline in `.github/workflows/` triggers only on its own paths, builds
the image in ACR (`az acr build` — no local Docker), points the App Service at
the new tag, and restarts it. Nothing else redeploys.

### One-time setup (done)

- App Services + plan + ACR already exist and are wired up.
- `site-risk-api` has a managed identity with `Cognitive Services OpenAI User`
  on the `mallory-ai` OpenAI resource (same as gift-api).
- GitHub repo **secrets**: `AZURE_CREDENTIALS`, `APPINSIGHTS_CONNECTION_STRING`.
- GitHub repo **vars**: `NEXT_PUBLIC_GIFT_APP_API`, `NEXT_PUBLIC_SITE_RISK_API`.
