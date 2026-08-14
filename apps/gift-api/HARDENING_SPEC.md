# Mallory Gift App — Hardening & Cost-Control Spec

**Goal:** Keep the live demo at `https://mallorygiesie.azurewebsites.net` **publicly clickable for recruiters (no login)** while making it **key-free, abuse-resistant, and cost-bounded**.

**Guiding principle — defense in depth.** No single control has to be perfect. Three layers stack so any one failing isn't catastrophic:
1. **Rate limit** (server-side) — polite first line + good UX. Can be simple.
2. **TPM quota cap** — bounds how *fast* spend can grow.
3. **Budget auto-shutoff** — bounds the *total* spend.

Because layers 2 and 3 are real backstops, the rate limiter (layer 1) does **not** need to be heavyweight (no Redis required for a low-traffic demo).

---

## Current state (findings from code review)

| Area | Finding | Severity |
|------|---------|----------|
| Question cap | **No rate limit exists anywhere.** The "5" is only the `SUGGESTIONS` array (prompt chips) in `ChatBot.tsx`. `/api/chat` accepts unlimited calls. | High |
| Secrets | Azure OpenAI key, Azure **Search admin key**, and Raindrop token live in `.env` on disk. No `.gitignore` in repo. | High (if ever pushed) |
| Open endpoints | `/api/chat`, `/api/sync`, `/api/generate` are all unauthenticated and each costs money. | High (cost/DoS) |
| Image proxy | `/api/proxy/image?url=` fetches any URL server-side → SSRF. Follows redirects, no host allowlist. | Medium |
| CORS | `allow_origins=["*"]`; `frontend_origin` setting exists but is unused. | Low–Medium |
| Budget | Azure budgets are **alert-only by default** — they do not stop spend. | High (cost) |
| Errors | `detail=str(exc)` returned to clients → internal info disclosure. | Low |
| Robustness | `tenacity` is a dependency but unused (no retries on 429s); enrichment parses LLM output with brittle regex. | Low |

---

## Decisions (locked)

- **Chat cap:** per-IP daily limit **+ global daily ceiling**.
- **On limit reached:** friendly message **+ email CTA** (`mallorygiesie@icloud.com`).
- **Cost stop:** **TPM quota cap + budget auto-shutoff** (both).

Tunable defaults (change in one config block):
- `CHAT_LIMIT_PER_IP_PER_DAY = 5`
- `CHAT_LIMIT_GLOBAL_PER_DAY = 200`
- Budget hard cap: **$25/month** (example — set to your comfort).

---

## Requirements

### R1 — Server-side chat rate limiting  ·  Priority: P0  ·  Effort: ~half day
**What:** Enforce the per-IP daily cap and global daily ceiling on `POST /api/chat` in the backend.

**Why:** Client-side limits are cosmetic — anyone can call `/api/chat` directly with `curl`. The cap only means something server-side.

**Approach:**
- Add a small in-memory limiter (two dict counters keyed by `(client_ip, UTC-date)` and `(UTC-date)`), reset daily. For a single App Service instance this is sufficient. (If you ever scale to >1 instance, move counters to Azure Table Storage — noted, not required now.)
- Derive client IP from `X-Forwarded-For` (App Service sits behind a proxy; `request.client.host` will be the proxy).
- Return HTTP **429** with a structured body `{ "error": "demo_limit", "scope": "ip"|"global" }` so the frontend can show the right message.
- Optionally return remaining-quota headers (`X-RateLimit-Remaining`) so the UI can show "3 questions left."

**Acceptance criteria:**
- 6th request from the same IP in a UTC day → 429 with `scope: "ip"`.
- 201st request globally in a day → 429 with `scope: "global"`.
- Direct `curl` to `/api/chat` is limited identically to the browser.

---

### R2 — Remove stored secrets via Managed Identity + RBAC  ·  P0  ·  ~half day
**What:** Authenticate the App Service to Azure OpenAI and Azure AI Search with a **managed identity** instead of API keys.

**Why:** Eliminates keys from `.env`/disk entirely; Entra issues short-lived tokens automatically. The Search key in `.env` is the **admin** key (full index read/write/delete) — highest-value thing to remove.

**Approach:**
- Enable **System-Assigned Managed Identity** on the App Service.
- Assign roles (Azure portal/CLI — *your action*):
  - `Cognitive Services OpenAI User` on the OpenAI resource.
  - `Search Index Data Reader` (+ `Search Index Data Contributor` if sync runs in prod) on the Search resource.
- Code: switch `services/azure_openai.py` and `services/azure_search.py` from `api_key=` to `DefaultAzureCredential` (use `azure-identity`; `get_bearer_token_provider` for the OpenAI client, `DefaultAzureCredential` for the Search client).
- **Raindrop token is NOT an Azure service** → keep it as a secret, but move it from `.env` to **App Service → Configuration → Application settings** (or Key Vault reference). Never on disk.
- Add a `.gitignore` with `.env` regardless, and rotate all three credentials if `.env` was ever committed/shared.

**Acceptance criteria:**
- App runs with **no** `AZURE_*_API_KEY` values present.
- `.env` is gitignored; Raindrop token read from app settings.

---

### R3 — Lock down expensive / abusable endpoints in production  ·  P0  ·  ~1–2 hrs
**What:** Disable or protect `/api/sync` and `/api/generate` when running in prod.

**Why:** Recruiters never need them, and they're the priciest paths (full re-ingest = many LLM calls; DALL·E ~$0.04–0.08/image). Leaving them open is the biggest single cost hole.

**Approach:**
- Add an `ENV` / `IS_PROD` setting. When prod: either don't register these routers, or guard them behind a secret admin header (`X-Admin-Token` compared to an app setting).
- Keep them available locally for your own use.

**Acceptance criteria:**
- `POST /api/sync/*` and `POST /api/generate/*` return 404/403 in prod without the admin token.

---

### R4 — Image proxy SSRF hardening (or removal)  ·  P1  ·  ~2–3 hrs
**What:** Restrict `routers/proxy.py` so it can't be used to reach internal/arbitrary hosts.

**Why:** Open server-side fetch = SSRF; exploitable now that it's deployed.

**Approach (if keeping it):**
- Enforce `https` scheme only.
- Resolve the hostname and **reject private/link-local/loopback ranges** (10/8, 172.16/12, 192.168/16, 127/8, 169.254/16, ::1, fc00::/7).
- Allowlist expected image domains (Raindrop/Pinterest CDNs) if practical.
- Do **not** blindly follow redirects (or re-validate the target after each redirect).
- Cap response size (e.g., 5 MB) and keep the existing content-type allowlist.

**Alternative (simpler):** store/serve image URLs directly from the client, or cache enriched thumbnails at ingest time, and **remove the proxy** entirely.

**Acceptance criteria:**
- Requests to internal IPs / non-image hosts are rejected before fetch.

---

### R5 — CORS lockdown  ·  P1  ·  ~15 min
**What:** Replace `allow_origins=["*"]` with the real origin(s).

**Approach:** Use the existing `frontend_origin` setting; in prod set it to `https://mallorygiesie.azurewebsites.net`. Scope `allow_methods` to what's used.

**Acceptance criteria:** Cross-origin calls from other sites are blocked by the browser.

---

### R6 — Hard cost controls (TPM cap + budget auto-shutoff)  ·  P0  ·  ~half day (mostly portal)
**What:** Two cost ceilings.

**6a. TPM quota cap (bounds spend *rate*):**
- In Azure AI Foundry / OpenAI resource, set the **tokens-per-minute (TPM)** quota on the chat and embedding deployments to a modest value. This throttles a runaway loop so cost can't spike. *Your action (portal).*

**6b. Budget auto-shutoff (bounds *total* spend):**
- Create a **Cost Management budget** on the resource group.
- Add an **Action Group** triggered at thresholds (e.g., 80% alert, 100% action).
- The 100% action runs automation (Logic App or Automation Runbook) that **stops the App Service** (or removes the OpenAI deployment). This is what actually halts spend — the budget alone won't.
- Add a lower **alert-only** threshold (e.g., 50%) so you get warned before shutoff.

**Acceptance criteria:**
- Sustained abuse is throttled by TPM (no fast spike).
- Hitting the dollar cap automatically stops the app (verified once in a test).

---

### R7 — Error handling & light observability  ·  P2  ·  ~2 hrs
- Stop returning `str(exc)` to clients; log server-side, return a generic message + request ID.
- Log per-day chat counts so you can see usage / confirm limits work.

---

### R8 — Optional robustness (nice-to-have)  ·  P3
- Wire `tenacity` retries onto Azure OpenAI calls (handles 429s gracefully).
- Replace regex JSON parsing in `enrichment.py` with `response_format={"type":"json_object"}`.

---

## Sequencing

**Phase 1 — before sharing the link widely (do these first):**
R1 (rate limit) · R2 (managed identity + secrets) · R3 (lock expensive endpoints) · R6 (cost caps).
> This is the set that makes the open demo safe.

**Phase 2 — hardening polish:** R4 (SSRF) · R5 (CORS) · R7 (errors).

**Phase 3 — robustness:** R8.

---

## Split of work

**Code (I can do):** R1, R2 (client changes), R3, R4, R5, R7, R8.
**Azure portal/CLI (your actions):** R2 role assignments + identity, R6 (TPM quota, budget, action group, automation), moving Raindrop token to app settings.

---

## Out of scope (separate effort)
Agentic tool-calling refactor and MCP server — tracked separately as a portfolio/feature enhancement, not part of hardening.
