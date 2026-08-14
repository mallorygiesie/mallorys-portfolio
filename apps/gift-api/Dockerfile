# Gift app API — standalone FastAPI service (no bundled frontend).
# The portfolio frontend is deployed separately (apps/web) and calls this
# service via NEXT_PUBLIC_GIFT_APP_API.
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . ./

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
