# Azure Setup Runbook — Managed Identity, App Settings & Cost Controls

Companion to `HARDENING_SPEC.md`. Run these from a terminal with the Azure CLI
(`az login` first). Commands you run; portal steps are flagged **[PORTAL]** where
the CLI is unreliable.

> **Order matters.** Do Part A (identity + roles) and confirm the app still works
> **before** Part B deletes the API keys — otherwise the app loses access.

---

## 0. Variables (edit these, then paste the whole block)

```bash
# --- fill in ---
SUB="<your-subscription-id>"
RG="<your-resource-group>"
APP="mallorygiesie"                 # the App Service name
OPENAI="<your-azure-openai-name>"   # Cognitive Services / OpenAI resource
SEARCH="<your-search-service-name>"
LOC="westus"                        # your region
RAINDROP_TOKEN="<rotate-then-paste-new-token>"
# ---------------

az account set --subscription "$SUB"
```

Not sure of the names? List them:

```bash
az webapp list -o table
az cognitiveservices account list -o table
az search service list -o table
```

---

## Part A — Managed Identity + RBAC  (R2)

### A1. Turn on the App Service's managed identity

```bash
PRINCIPAL_ID=$(az webapp identity assign -n "$APP" -g "$RG" --query principalId -o tsv)
echo "Principal: $PRINCIPAL_ID"
```

### A2. Get the resource scopes

```bash
OPENAI_ID=$(az cognitiveservices account show -n "$OPENAI" -g "$RG" --query id -o tsv)
SEARCH_ID=$(az search service show -n "$SEARCH" -g "$RG" --query id -o tsv)
```

### A3. Enable AAD auth on the Search service (keeps keys working during transition)

```bash
az search service update -n "$SEARCH" -g "$RG" --auth-options aadOrApiKey
```

### A4. Assign roles to the app's identity

```bash
# Azure OpenAI: call models
az role assignment create \
  --assignee-object-id "$PRINCIPAL_ID" --assignee-principal-type ServicePrincipal \
  --role "Cognitive Services OpenAI User" --scope "$OPENAI_ID"

# Azure AI Search: read the index (use *Data Contributor* instead if you ever run /sync in prod)
az role assignment create \
  --assignee-object-id "$PRINCIPAL_ID" --assignee-principal-type ServicePrincipal \
  --role "Search Index Data Reader" --scope "$SEARCH_ID"
```

Role assignments can take a few minutes to propagate.

---

## Part B — App settings & key removal  (R2/R3)

### B1. Set production config

```bash
ADMIN_TOKEN=$(openssl rand -hex 24)
echo "Save this admin token somewhere safe: $ADMIN_TOKEN"

az webapp config appsettings set -n "$APP" -g "$RG" --settings \
  ENVIRONMENT=production \
  ADMIN_TOKEN="$ADMIN_TOKEN" \
  RAINDROP_TOKEN="$RAINDROP_TOKEN" \
  CHAT_LIMIT_PER_IP_PER_DAY=5 \
  CHAT_LIMIT_GLOBAL_PER_DAY=200
```

### B2. Verify the app still works *with roles* before removing keys

```bash
az webapp restart -n "$APP" -g "$RG"
sleep 30
curl -s -X POST "https://$APP.azurewebsites.net/api/chat" \
  -H "Content-Type: application/json" -d '{"question":"test"}' | head -c 300
```

If you get a normal answer, the identity path is... not yet proven (keys still
present). Proceed to B3, then re-test — a working answer there proves managed
identity works.

### B3. Remove the API keys (forces managed identity)

```bash
az webapp config appsettings delete -n "$APP" -g "$RG" \
  --setting-names AZURE_OPENAI_API_KEY AZURE_SEARCH_API_KEY

az webapp restart -n "$APP" -g "$RG"
sleep 30
curl -s -X POST "https://$APP.azurewebsites.net/api/chat" \
  -H "Content-Type: application/json" -d '{"question":"test"}' | head -c 300
```

A normal answer now = managed identity confirmed, zero stored keys. 🎉

### B4. (Optional, stronger) Disable key auth entirely

```bash
# Azure OpenAI: refuse API keys outright
az resource update --ids "$OPENAI_ID" --set properties.disableLocalAuth=true
# Search: AAD only
az search service update -n "$SEARCH" -g "$RG" --auth-options aadOrApiKey --aad-auth-failure-mode http403
```

---

## Part C — R6a: TPM quota cap (bounds spend *rate*)

Capacity is in units of **1,000 tokens/min**. A small cap means a runaway loop
can only spend so fast. List your deployments, then cap each.

```bash
az cognitiveservices account deployment list -n "$OPENAI" -g "$RG" -o table
```

```bash
# Chat model — 10 = 10K TPM (adjust to taste)
az cognitiveservices account deployment update \
  -n "$OPENAI" -g "$RG" --deployment-name "gpt-4o" --sku-capacity 10

# Embeddings
az cognitiveservices account deployment update \
  -n "$OPENAI" -g "$RG" --deployment-name "text-embedding-3-small" --sku-capacity 10
```

> If `deployment update` isn't available in your CLI version:
> **[PORTAL]** Azure AI Foundry → your resource → **Deployments** → select the
> deployment → **Edit** → set **Tokens per Minute Rate Limit** → Save.

**Why this is the real safety net:** once TPM is capped, your *maximum possible*
monthly spend is bounded no matter how much abuse hits the open endpoint. Do the
math (cap × price × minutes) and if the worst case is acceptable, the budget
auto-shutoff below is belt-and-suspenders rather than load-bearing.

---

## Part D — R6b: Budget + alerts (bounds *total* spend)

### D1. Action group (who gets notified)

```bash
az monitor action-group create \
  -n "demo-budget-alerts" -g "$RG" --short-name "budget" \
  --email-receiver name=me email=mallorygiesie@icloud.com
```

```bash
AG_ID=$(az monitor action-group show -n "demo-budget-alerts" -g "$RG" --query id -o tsv)
```

### D2. Create the budget with alert thresholds (via `az rest`, the reliable path)

```bash
START=$(date -u +%Y-%m-01)
cat > /tmp/budget.json <<JSON
{
  "properties": {
    "category": "Cost",
    "amount": 25,
    "timeGrain": "Monthly",
    "timePeriod": { "startDate": "${START}T00:00:00Z" },
    "notifications": {
      "warn50": {
        "enabled": true, "operator": "GreaterThanOrEqualTo", "threshold": 50,
        "contactEmails": ["mallorygiesie@icloud.com"],
        "contactGroups": ["${AG_ID}"], "thresholdType": "Actual"
      },
      "alert90": {
        "enabled": true, "operator": "GreaterThanOrEqualTo", "threshold": 90,
        "contactEmails": ["mallorygiesie@icloud.com"],
        "contactGroups": ["${AG_ID}"], "thresholdType": "Actual"
      },
      "stop100": {
        "enabled": true, "operator": "GreaterThanOrEqualTo", "threshold": 100,
        "contactEmails": ["mallorygiesie@icloud.com"],
        "contactGroups": ["${AG_ID}"], "thresholdType": "Actual"
      }
    }
  }
}
JSON

az rest --method put \
  --url "https://management.azure.com/subscriptions/${SUB}/resourceGroups/${RG}/providers/Microsoft.Consumption/budgets/demo-budget?api-version=2023-11-01" \
  --body @/tmp/budget.json
```

This gives you reliable **alerts** at 50/90/100%. The 100% notification fires the
action group, which we now extend to actually stop the app.

### D3. Auto-shutoff at 100% (the runbook)

The cleanest reliable hard-stop is an **Automation runbook** that stops the web
app, triggered by the action group.

```bash
# Automation account + its own identity
az automation account create -n "demo-auto" -g "$RG" -l "$LOC"
AUTO_PRINCIPAL=$(az automation account show -n "demo-auto" -g "$RG" --query identity.principalId -o tsv 2>/dev/null)
# If empty, enable identity in [PORTAL]: Automation account → Identity → System assigned → On

# Let the runbook stop resources in this RG
RG_ID=$(az group show -n "$RG" --query id -o tsv)
az role assignment create --assignee-object-id "$AUTO_PRINCIPAL" \
  --assignee-principal-type ServicePrincipal --role "Contributor" --scope "$RG_ID"
```

Runbook body — save as `stop-app.ps1`:

```powershell
param()
Connect-AzAccount -Identity | Out-Null
Stop-AzWebApp -ResourceGroupName "<RG>" -Name "mallorygiesie"
```

```bash
az automation runbook create -n "stop-app" -g "$RG" \
  --automation-account-name "demo-auto" --type PowerShell
az automation runbook replace-content -n "stop-app" -g "$RG" \
  --automation-account-name "demo-auto" --content @stop-app.ps1
az automation runbook publish -n "stop-app" -g "$RG" \
  --automation-account-name "demo-auto"
```

**[PORTAL] Final wiring (CLI for this link is fiddly):**
Azure portal → **Cost Management** → **Budgets** → `demo-budget` → **Edit alert
conditions** → on the 100% notification, add an **Action Group** =
`demo-budget-alerts`. Then in **Monitor → Action groups → demo-budget-alerts →
Actions**, add an **Automation Runbook** action pointing to `demo-auto / stop-app`.

After this, hitting 100% of the $25 budget automatically stops the App Service.
(To bring it back: `az webapp start -n "$APP" -g "$RG"`.)

---

## Part E — Verify the hardening

```bash
# 1) Rate limit: 6th call in a day should 429
for i in 1 2 3 4 5 6; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST \
    "https://$APP.azurewebsites.net/api/chat" \
    -H "Content-Type: application/json" -d '{"question":"hi"}'
done
# expect: 200 200 200 200 200 429

# 2) Expensive endpoints gated in prod (no admin token) -> 404
curl -s -o /dev/null -w "sync=%{http_code}\n" -X POST "https://$APP.azurewebsites.net/api/sync/raindrop"

# 3) Admin token works
curl -s -o /dev/null -w "sync(admin)=%{http_code}\n" -X POST \
  "https://$APP.azurewebsites.net/api/sync/raindrop" -H "X-Admin-Token: $ADMIN_TOKEN"
```

---

## Quick reference — what stops a runaway bill

| Layer | Bounds | Latency | Set in |
|-------|--------|---------|--------|
| Rate limit (R1) | requests/day per IP + global | instant | code (deployed) |
| TPM cap (R6a) | spend **rate** | instant | Part C |
| Budget alerts (R6b) | notifies you | ~hours | Part D2 |
| Auto-shutoff (R6b) | **total** spend | ~hours | Part D3 |
