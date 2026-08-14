# SiteRisk API — standalone FastAPI service (geocode + multi-agent risk fan-out).
# Listens on 8000 in the container; map it to whatever host port / ingress you
# like. The portfolio frontend (apps/web) calls this via NEXT_PUBLIC_SITE_RISK_API.
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . ./

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
