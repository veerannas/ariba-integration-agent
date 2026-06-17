# Ariba Integration Agent — Deep Technical Analysis
## For: opencode agent  |  Prepared by: Cowork research agent  |  Date: 2026-05-11

---

## 1. Project Overview

The **Ariba Integration Agent (AIA)** is a Chrome extension (Manifest V3, v3.1.0) designed to help SAP Ariba buyers and suppliers complete onboarding and integration work on the SAP Business Network (SBN). The extension runs a side panel and tab view on `*.ariba.com` pages and provides:

- Supplier/buyer onboarding stage tracking (6-stage pipeline)
- EDI X12 ↔ cXML field mapping reference (850/855/856/810/820)
- CIG adapter and connectivity guidance (AS2, VAN, HTTPS)
- Error detection on Ariba pages (auto-scan SAP UI5 DOM)
- Test plan and Integration Guide Workbook (IGW) generation
- AI knowledge base (all local, rule-based — no live API calls yet)

**Current project phase:** Building the API integration layer to programmatically access supplier accounts via the SAP Business Network REST API using supplier admin credentials.

---

## 2. Complete File Map

```
ariba-integration-agent/
├── manifest.json          — MV3 manifest, permissions, host_permissions
├── background.js          — Service worker: message router, AI knowledge base, test plan/IGW generators
├── aia-platform.js        — Environment abstraction (extension vs. web app), storage/messaging APIs
├── content.js             — Injected into *.ariba.com: FAB button, context detection, error scanning
├── sidepanel.html         — Side panel HTML shell
├── sidepanel.js           — Side panel controller (nav, tabs, all UI logic — ~3000 lines)
├── sidepanel-actions.js   — Pop-out to full tab action
├── tab.html               — Full tab view
├── tab-mode.js            — Tab-mode initialization
├── index.html             — Standalone web app entry
├── panel.js               — Panel initialization
├── data/
│   ├── mapping-rules.json — Deterministic cXML↔EDI conversion rules, UoM lookup, N9 patterns
│   └── schema.js          — chrome.storage schema: suppliers, buyers, stages, tasks, B2B transactions
├── lib/
│   ├── xlsx.full.min.js   — Excel generation library
│   └── xlsx-js-style.min.js
└── styles/
    ├── sidepanel.css
    ├── content.css
    └── tab-wide.css
```

---

## 3. Architecture Deep Dive

### 3.1 Message Bus (background.js)
All extension pages communicate with `background.js` via `chrome.runtime.sendMessage`. The current message types are:

| Message Type | Handler | Notes |
|---|---|---|
| `GET_PAGE_CONTEXT` | `detectContext()` | URL-based context detection |
| `SAVE_INTEGRATION` / `DELETE_INTEGRATION` | CRUD in `chrome.storage.local` | |
| `AI_QUERY` | `handleAIQuery()` | Local KB only, no live API |
| `GENERATE_TEST_PLAN` | `generateTestPlan()` | Template-based |
| `GENERATE_IGW` | `generateIGW()` | Template-based |
| `SCORE_READINESS` | `scoreSupplierReadiness()` | Rule-based scoring |
| `DETECT_ERRORS` | `detectAndSuggestFixes()` | Regex pattern matching |
| `CONTEXT_DETECTED` | Stores & broadcasts context | From content.js |
| `OPEN_SIDEPANEL` / `OPEN_TAB` | Window management | |

**Gap**: No `ARIBA_API_*` message types exist yet. All intelligence is local.

### 3.2 Storage Schema (data/schema.js)
The `chrome.storage.local` schema stores:
- `suppliers` — keyed by ANID (Ariba Network ID), per-stage task completion, mandatory docs
- `buyers` — keyed by buyer ID, linked supplier ANIDs
- `supplierMappings` — per-ANID per-transaction-type mapping validation results
- `settings` — view prefs, last active supplier/buyer
- `currentContext` — ANID, name, portal, URL (populated by content.js)

**Important**: The storage is entirely local. There is no synced state with the live Ariba Network.

### 3.3 Content Script Context Detection (content.js)
The content script uses a 6-strategy cascade to detect ANID and org name:
1. `localStorage` — SAP Business Network stores `sa.orgAnid`, `sa.orgName`, `sa.orgType`
2. URL params — `?anid=`, `?ANID=`, `?supplierId=`
3. URL path pattern — `AN\d{8,14}` regex
4. Page body text scan — first 5000 chars
5. DOM `data-anid` attributes
6. CSS selector scan for org name elements

This is already production-quality and will be essential for correlating API responses with the active browser context.

### 3.4 Platform Abstraction (aia-platform.js)
`window.AIA` provides unified APIs for:
- `AIA.storage.get/set/remove` — chrome.storage or localStorage fallback
- `AIA.messaging.send/onMessage` — chrome.runtime or in-memory event bus
- `AIA.mode.get/set/detect` — sidepanel vs tab vs webapp
- `AIA.context.detect()` — delegates to content script or manual entry

**Important for API layer**: Any new API client should use `AIA.messaging.send({ type: 'ARIBA_API_*' })` to keep all network calls in the service worker (background.js). This avoids CORS issues from sidepanel pages.

---

## 4. Current Manifest Permissions — What's Missing for API Access

Current `host_permissions`:
```json
"https://*.ariba.com/*",
"https://service.ariba.com/*",
"https://integration.ariba.com/*",
"http://*.ariba.com/*",
"https://*.sap.com/*"
```

**Required additions for SAP Business Network API**:
```json
"https://api.ariba.com/*",
"https://openapi.ariba.com/*",
"https://sandbox.api.ariba.com/*"
```

The OAuth token endpoint (`api.ariba.com`) and the REST API base (`openapi.ariba.com`) are separate domains from `service.ariba.com`. Without these in `host_permissions`, the service worker will get CORS errors when making API calls.

---

## 5. SAP Business Network (SBN) API — Complete Access Guide

### 5.1 Prerequisites

Before making any API calls, you need:

1. **SAP API Business Hub account** at `https://api.sap.com`
   - Register your application to get `client_id` and `client_secret`
   - Subscribe to the relevant SAP Business Network APIs

2. **Supplier admin credentials**: username + password for the supplier's Ariba Network account

3. **Supplier ANID**: The 12–16 digit Ariba Network ID (e.g., `AN01234567890123`)

### 5.2 Authentication — OAuth 2.0 Flows

SAP Business Network APIs use OAuth 2.0. There are two relevant flows:

#### Flow A: Two-Legged OAuth (Application-level, no user context)
Used for background/batch operations where no user session is required.
```http
POST https://api.ariba.com/v2/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&
client_id={YOUR_CLIENT_ID}&
client_secret={YOUR_CLIENT_SECRET}
```

#### Flow B: Password Grant (User credentials + app credentials)
Used when you have supplier admin username/password and want to act as that user.
```http
POST https://api.ariba.com/v2/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=password&
client_id={YOUR_CLIENT_ID}&
client_secret={YOUR_CLIENT_SECRET}&
username={SUPPLIER_ADMIN_USERNAME}&
password={SUPPLIER_ADMIN_PASSWORD}
```

Both return:
```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### 5.3 Making API Requests

All API calls use:
```http
GET https://openapi.ariba.com/api/{api-name}/{version}/{realm}/{endpoint}
Authorization: Bearer {access_token}
apikey: {YOUR_API_KEY}
Content-Type: application/json
```

**Two required headers**: `Authorization: Bearer {token}` AND `apikey: {api_key_from_sap_api_hub}`.

### 5.4 Key Supplier-Relevant API Endpoints

#### SBN Supplier API (most relevant for this project)
Base: `https://openapi.ariba.com/api/sbn-supplier/v1/prod`

| Endpoint | Method | Purpose |
|---|---|---|
| `/suppliers/{anid}` | GET | Get supplier profile |
| `/suppliers/{anid}/relationships` | GET | Get buyer relationships |
| `/suppliers/{anid}/users` | GET | Get supplier users/contacts |
| `/suppliers/{anid}/documents` | GET | Get document exchange summary |

#### Network Transaction API
Base: `https://openapi.ariba.com/api/network-transactions/v1/prod`

| Endpoint | Method | Purpose |
|---|---|---|
| `/ordersqueue` | GET | POs waiting for supplier |
| `/orders/{id}` | GET | Specific PO details |
| `/invoices` | GET | Invoice list |
| `/invoices/{id}` | GET | Specific invoice |
| `/shipnotices` | GET | ASNs |

#### Supplier Registration API
Base: `https://openapi.ariba.com/api/supplier-registration/v1/prod`

| Endpoint | Method | Purpose |
|---|---|---|
| `/suppliers` | POST | Register new supplier |
| `/suppliers/{id}/status` | GET | Registration status |

### 5.5 Realm Parameter
Most Ariba APIs require a `realm` parameter (= the buyer's AN realm identifier or the procurement system identifier). For supplier-facing APIs, this is typically the buyer's ANID or a realm string configured in your app.

**For sandbox testing**: Replace `prod` with `sandbox` in the URL path.

### 5.6 Common Authentication Errors

| Error | Cause | Fix |
|---|---|---|
| `401 Unauthorized` | Expired or invalid token | Re-fetch token, check client_id/secret |
| `403 Forbidden` | App not subscribed to this API | Subscribe in api.sap.com |
| `400 Bad Request` | Wrong grant_type or missing params | Check form body encoding |
| `invalid_client` | Wrong client_id or client_secret | Re-check app credentials |

---

## 6. How to Wire This Into the Extension

### 6.1 New Module: `ariba-api.js` (to be added)
This should be a standalone module loaded by `background.js` as a script import (MV3 service workers support `importScripts()` or ES module imports).

Recommended structure:
```javascript
// ariba-api.js — SAP Business Network API Client

const ARIBA_API = {
  AUTH_URL: 'https://api.ariba.com/v2/oauth/token',
  BASE_URL: 'https://openapi.ariba.com',
  
  // Token cache
  _token: null,
  _tokenExpiry: 0,

  async getToken(clientId, clientSecret, username, password) {
    // Check cached token
    if (this._token && Date.now() < this._tokenExpiry - 60000) {
      return this._token;
    }
    // Fetch new token
    const body = new URLSearchParams({
      grant_type: 'password',
      client_id: clientId,
      client_secret: clientSecret,
      username,
      password
    });
    const res = await fetch(this.AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
    const data = await res.json();
    this._token = data.access_token;
    this._tokenExpiry = Date.now() + (data.expires_in * 1000);
    return this._token;
  },

  async request(path, apiKey, token, method = 'GET', body = null) {
    const res = await fetch(`${this.BASE_URL}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': apiKey,
        'Content-Type': 'application/json'
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
    return res.json();
  }
};
```

### 6.2 New Message Types in background.js

Add to the message router:
```javascript
'ARIBA_API_AUTH':     () => aribaApiAuth(msg.credentials).then(sendResponse),
'ARIBA_GET_SUPPLIER': () => aribaGetSupplier(msg.anid).then(sendResponse),
'ARIBA_GET_ORDERS':   () => aribaGetOrders(msg.anid).then(sendResponse),
'ARIBA_GET_INVOICES': () => aribaGetInvoices(msg.anid).then(sendResponse),
```

### 6.3 Credential Storage
Credentials must be stored encrypted. Use `chrome.storage.session` (cleared when browser closes, not persisted to disk) for access tokens, and prompt the user for credentials on each session. **Never store the raw password** — only the token.

```javascript
// Store token (session only)
chrome.storage.session.set({ 
  aribaApiToken: token,
  aribaApiExpiry: expiry,
  aribaApiKey: apiKey
});
```

### 6.4 Manifest Changes Required

```json
// manifest.json — add to host_permissions:
"https://api.ariba.com/*",
"https://openapi.ariba.com/*",

// Add to permissions (for session storage):
"storage"  // already present
```

Note: `chrome.storage.session` requires the `storage` permission which is already granted.

---

## 7. Current Integration Gaps (Prioritized for opencode agent)

### Gap 1 — No API Authentication Module [CRITICAL — this is the current work]
**What's missing**: There is zero API call code anywhere in the extension. No `fetch()` to Ariba APIs.  
**What to build**: `ariba-api.js` with OAuth token flow + request wrapper.  
**Blocked by**: App registration on api.sap.com (needs client_id/client_secret).

### Gap 2 — Manifest Missing API Domains [CRITICAL]
**What's missing**: `api.ariba.com` and `openapi.ariba.com` not in `host_permissions`.  
**Impact**: Service worker fetch() to these URLs will be blocked.  
**Fix**: 2 lines in manifest.json.

### Gap 3 — No Credential Management UI [HIGH]
**What's missing**: No UI in sidepanel for entering/storing API credentials.  
**What to build**: A "Settings" or "Connect" section in sidepanel.html where the user can enter:
  - Client ID / Client Secret (from api.sap.com app)
  - Supplier admin username + password (or ANID + API key for 2LO)
  - These trigger a background auth call and store the token in `chrome.storage.session`

### Gap 4 — No Live Data in Supplier Dashboard [HIGH]
**What's missing**: The supplier dashboard shows manually-tracked stages. It doesn't pull live data from AN.  
**What to build**: After auth, enrich the supplier record with live data from the SBN Supplier API.

### Gap 5 — Context Detection Doesn't Trigger API Calls [MEDIUM]
**What's missing**: `content.js` detects ANID and sends `CONTEXT_DETECTED`, but background.js only stores it — it doesn't make an API call to enrich the context with live supplier data.  
**What to build**: When `CONTEXT_DETECTED` fires with a valid ANID and a token is available, auto-fetch supplier profile and cache it.

### Gap 6 — No Error State / Token Refresh Handling [MEDIUM]
**What's missing**: Token expiry (1 hour) will silently break API calls.  
**What to build**: Token refresh logic in the API client, with user notification on auth failure.

---

## 8. Supplier Admin Access — Exact Steps for opencode Agent

Here is the precise sequence to implement supplier API access with credentials already in hand:

**Step 1** — Register on SAP API Business Hub  
URL: `https://api.sap.com`  
- Create a free developer account  
- Find "SAP Business Network" in the API catalog  
- Subscribe to: **SAP Business Network Supplier API**, **SAP Business Network Document API**  
- Create an "Application" → copy `client_id`, `client_secret`, and `API Key`

**Step 2** — Test Auth (can be done with curl or Postman first)
```bash
curl -X POST https://api.ariba.com/v2/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&username=SUPPLIER_USERNAME&password=SUPPLIER_PASSWORD"
```
Expected: `{ "access_token": "eyJ...", "expires_in": 3600 }`

**Step 3** — Test a Supplier API call
```bash
curl -X GET "https://openapi.ariba.com/api/sbn-supplier/v1/prod/suppliers/YOUR_ANID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "apikey: YOUR_API_KEY"
```

**Step 4** — Add to extension  
- Add `host_permissions` in manifest.json  
- Create `ariba-api.js`  
- Add message handlers in background.js  
- Add credential input UI in sidepanel  
- Wire content.js `CONTEXT_DETECTED` → auto-fetch if token available

---

## 9. Key Architectural Decisions for the API Layer

### All API calls must go through background.js (service worker)
The `sidepanel.html` and `content.js` pages run in renderer contexts with restricted fetch() access. All cross-origin requests must be made from the service worker. The existing `chrome.runtime.sendMessage` bus already handles this pattern — extend it for API calls.

### Token management: session vs local storage
- **`chrome.storage.session`**: Token survives tab reloads within the browser session; cleared on browser restart. Best for access tokens.
- **`chrome.storage.local`**: Persists across restarts. Use for API Key (less sensitive) and for caching supplier data. **Never** store passwords here.

### Sandbox vs Production
The Ariba Network has a test/sandbox environment. The URLs differ:
- Production auth: `https://api.ariba.com/v2/oauth/token`
- Sandbox auth: `https://sandbox.api.ariba.com/v2/oauth/token`  
- Production API: `https://openapi.ariba.com/api/{api}/v1/prod/...`
- Sandbox API: `https://openapi.ariba.com/api/{api}/v1/sandbox/...`

The extension should have a toggle for sandbox vs production (can reuse the existing settings storage structure).

### Rate Limiting
SAP Business Network APIs are rate-limited. Default is typically 10 req/sec per app. The API client should implement simple throttling and exponential backoff on 429 responses.

---

## 10. What's Already Done (Don't Rebuild)

These are solid and don't need changes for the API integration work:

- ✅ `aia-platform.js` — Use `AIA.messaging.send()` from sidepanel to call background APIs
- ✅ `AIA.storage.get/set` — Use this for caching API responses
- ✅ Context detection in `content.js` — ANID is already extracted reliably
- ✅ Stage/task schema in `data/schema.js` — Supplier records just need an `apiData` field added
- ✅ Message routing in `background.js` — Just add new route handlers
- ✅ Error detection patterns in `content.js` — These are for UI-layer errors, separate concern from API

---

## 11. Summary for opencode Agent

**Current state**: The extension is a high-quality Chrome MV3 extension with complete UI for supplier/buyer onboarding. All intelligence is local (no API calls). The codebase is clean, modular, and ready for the API layer.

**Immediate task**: Implement supplier account access via the SAP Business Network REST API.

**Minimum viable implementation** (in priority order):
1. Add `api.ariba.com` and `openapi.ariba.com` to `manifest.json` host_permissions
2. Create `ariba-api.js` with OAuth token fetch + API request wrapper
3. Add `ARIBA_API_AUTH`, `ARIBA_GET_SUPPLIER` message handlers in `background.js`
4. Add credential input section in sidepanel UI (client_id, client_secret, username, password)
5. Wire auth → store token in `chrome.storage.session`
6. Wire `CONTEXT_DETECTED` → auto-fetch supplier profile when token is present
7. Display live API data in the supplier dashboard

**The API registration step (api.sap.com) must happen before any code can be tested** — this requires the human to manually register an app and provide `client_id`, `client_secret`, and `API Key` to the project.
