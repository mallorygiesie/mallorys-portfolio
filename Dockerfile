# Portfolio deployable = Next.js portfolio (apps/web) bundled with the gift-api
# backend that serves it. This reproduces what runs at mallorygiesie.azurewebsites.net:
# one image, one URL. The gift app demo talks to this same origin (/api); the
# SiteRisk demo talks to the separate site-risk-api via NEXT_PUBLIC_SITE_RISK_API.
#
# Build context is the REPO ROOT (needs both apps/web and apps/gift-api).

# ---- Stage 1: build the Next.js static export ----
FROM node:24-alpine AS web-build
WORKDIR /web

# NEXT_PUBLIC_* are baked in at build time -> passed as build args from CI.
ARG NEXT_PUBLIC_GIFT_APP_API
ARG NEXT_PUBLIC_SITE_RISK_API
ARG NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING
ENV NEXT_PUBLIC_GIFT_APP_API=$NEXT_PUBLIC_GIFT_APP_API
ENV NEXT_PUBLIC_SITE_RISK_API=$NEXT_PUBLIC_SITE_RISK_API
ENV NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING=$NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING

COPY apps/web/package*.json ./
RUN npm ci
COPY apps/web/ ./
RUN npm run build   # next.config.ts has output: "export" -> ./out

# ---- Stage 2: gift-api backend + the built frontend ----
FROM python:3.11-slim
WORKDIR /app

COPY apps/gift-api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/gift-api/ ./

# Place the Next.js export where main.py serves it.
COPY --from=web-build /web/out ./frontend_dist/

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
