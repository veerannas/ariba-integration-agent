# AIA — Ariba Integration Agent: Complete Handover Reference
## Version: 4.1.1 | Last updated: 2026-09-06

---

## 1. What Is AIA

The **Ariba Integration Agent (AIA)** is a Chrome Extension (Manifest V3) + web portal + Python backend that helps SAP Ariba buyers and suppliers complete onboarding and integration work on the SAP Business Network (SBN). It ships as:

- **Chrome extension** — sidepanel + tab view on `*.ariba.com` pages
- **Python backend** (`aie-backend/`) — FastAPI on port 8100, real cXML parsing + Excel IGW generation
- **Web portal** (`web/`) — Next.js 16, WebMCP-powered, submitted to WebMCP hackathon

**Core value proposition**: Reduce supplier onboarding from 120 days → 14 days via AI-assisted EDI/cXML mapping, guided test workflows, and Integration Guide Workbook (IGW) automation.

---

## 2. Repository Layout

```
ariba-integration-agent/
├── manifest.json            MV3 manifest, permissions, host_permissions
├── background.js            Service worker: message router, AI KB, test plan/IGW generators (~32KB)
├── aia-platform.js          Environment abstraction (extension vs web app), storage/messaging APIs
├── content.js               Injected into *.ariba.com — FAB button, context detection, error scanning (~27KB)
├── sidepanel.html           Side panel HTML shell (~104KB)
├── sidepanel.js             Side panel controller — nav, tabs, all UI logic
├── sidepanel-actions.js     Pop-out to full tab action
├── tab.html                 Full tab view
├── panel.js                 Panel initialization (~57KB)
├── index.html               Standalone web app entry (~45KB)
├── cxml-parser.js           cXML parse + sanitize (r00–r16 rules)
├── cxml-anonymizer.js       cXML anonymization (~30KB)
├── cxml-guide-engine.js     cXML guide generation (~63KB)
├── edi-guide-engine.js      EDI guide generation (~44KB)
├── atlas-updater.js         Atlas OData v4 update client
├── atlas-mockup.html        Atlas standalone mockup (~25KB)
├── data/
│   ├── mapping-rules.json   Deterministic cXML↔EDI conversion rules, UoM lookup, N9 patterns
│   └── schema.js            chrome.storage schema: suppliers, buyers, stages, tasks, B2B transactions
├── lib/
│   ├── xlsx.full.min.js     Excel generation
│   └── xlsx-js-style.min.js
├── styles/
│   ├── sidepanel.css
│   ├── content.css
│   └── tab-wide.css
├── icons/
├── aie-backend/
│   └── aie_server.py        FastAPI backend (port 8100)
└── web/                     Next.js 16 WebMCP portal
    ├── app/
    │   ├── page.tsx         Main portal (3-col layout: PO list · detail tabs · agent panel)
    │   ├── demo/page.tsx    /demo landing page for hackathon judges
    │   └── api/ariba/       6 API routes (proxy to :8100 or mock)
    ├── components/          POCard, WebMCPBadge, OnboardingChecklist, etc.
    └── lib/
        ├── webmcp/tools.ts  6 navigator.tools.register() calls
        ├── ariba/mock.ts    5 mock POs, 3 scenarios, 13-step checklist
        └── ariba/edi-mappings.ts  19 EDI X12 850 ↔ cXML field mappings
```

---

## 3. Test Central Workflow — Stepper Stages

The extension's primary workflow is a 4-stage stepper in both `sidepanel.html` and `tab.html`. Stage navigation uses `data-aie-stage` attributes via `navigateStage(stage)` in `sidepanel.js`.

| Step | Stage ID       | Label      | View Div      | Purpose                                 |
|------|---------------|------------|---------------|-----------------------------------------|
| 1    | `creator`     | Value Prop | `#aie-creator` | Upload cXML, run sanitizer, compose emails |
| 2    | `retrieval`   | PO SAMPLE  | `#aie-retrieval` | Fetch/paste raw PO cXML                |
| 3    | `analyzer`    | Test Case  | `#aie-analyzer` | Generate test scenarios from PO data   |
| 4    | `tester`      | Tracker    | `#aie-tester`  | Atlas tracker / status tracking         |

Active stage set via CSS class `active`. Stepper HTML structure:
```html
<div class="arrow-step active" data-aie-stage="creator">...</div>
<div class="arrow-step" data-aie-stage="retrieval">...</div>
<div class="arrow-step" data-aie-stage="analyzer">...</div>
<div class="arrow-step last" data-aie-stage="tester">...</div>
```

---

## 4. cXML Parser & Sanitizer (`cxml-parser.js`)

### `CXMLParser.parse(xmlString)` → `{ ok, orderId, orderDate, ... }`
Parses OrderRequest cXML. Returns structured fields including line items.

### `CXMLParser.sanitize(xmlString)` → `{ ok, xml, changes, count, firedIds }`
Applies 17 sanitization rules (r00–r16) to replace real buyer/supplier data with test tokens.

**Sanitization Rules:**

| ID  | Rule | Token |
|-----|------|-------|
| r00 | `cXML.timestamp` → | `#TIMESTAMP#` |
| r01 | `cXML.payloadID` → | `#PAYLOADID#` |
| r02 | `deploymentMode=production` → | `test` |
| r03 | `Header > From > Credential > Identity` → | `#SENDERID#` |
| r04 | `Header > To > Credential > Identity` → | `#RECEIVERID#` |
| r05 | `Header > Sender > Credential > Identity` → | `#PROVIDERID#` |
| r06 | `OrderRequestHeader.orderDate` → | `#DATETIME#` |
| r07 | `OrderRequestHeader.orderID` → | `#DOCUMENTID#` |
| r08 | `OrderRequestHeader.agreementID` → | `#DOCUMENTID#` |
| r09 | `OrderRequestHeader.agreementPayloadID` → | `#PAYLOADID#` |
| r10 | `requestedDeliveryDate` year | +100 |
| r11 | `effectiveDate` | prior to today |
| r12 | `expirationDate` year | +100 |
| r13 | `ShipFrom` address | test (PA, US 15212) |
| r14 | `RemitTo` address | test (PA, US 15212) |
| r15 | `ServicePeriod startDate` → | `#DATETIME#` |
| r16 | `ServicePeriod endDate` → | `#DATETIME#` |

---

## 5. Atlas OData API (`atlas-updater.js`)

### Base URL
```
https://atlas.ariba.com/Atlas/api/data/v9.1
```

### Authentication
- Basic Auth or OAuth Bearer token (Ariba credentials)
- Header: `Authorization: Bearer <token>` or `Authorization: Basic <b64>`

### Key Methods

#### `AtlasUpdater.updateRecord(entitySet, id, payload)`
Updates a single Atlas OData v4 record (PATCH).
```javascript
await AtlasUpdater.updateRecord('SupplierOnboardingTasks', taskId, {
  Status: 'Completed',
  Notes: 'Test passed'
});
```

#### `AtlasUpdater.bulkUpdate(entitySet, records)`
Batch update multiple records.
```javascript
await AtlasUpdater.bulkUpdate('SupplierOnboardingTasks', [
  { id: '001', Status: 'In Progress' },
  { id: '002', Status: 'Completed' }
]);
```

### OData v4 Query Examples
```
GET /Atlas/api/data/v9.1/SupplierOnboardingTasks?$filter=Status eq 'Open'
GET /Atlas/api/data/v9.1/Suppliers?$expand=Tasks&$top=50
PATCH /Atlas/api/data/v9.1/SupplierOnboardingTasks('TASK-001')
  Body: { "Status": "Completed" }
```

---

## 6. SAP Business Network REST API

### Authentication: OAuth 2.0

**Token endpoint:**
```
POST https://api.ariba.com/v2/oauth/token
Content-Type: application/x-www-form-urlencoded
```

**Two-legged (app credentials only):**
```
grant_type=client_credentials&client_id=YOUR_ID&client_secret=YOUR_SECRET
```

**Password grant (with supplier admin credentials):**
```
grant_type=password&client_id=YOUR_ID&client_secret=YOUR_SECRET&username=SUPPLIER_USER&password=SUPPLIER_PASS
```

Response: `{ "access_token": "eyJ...", "token_type": "Bearer", "expires_in": 3600 }`

### API Request Pattern
```http
GET https://openapi.ariba.com/api/{api-name}/{version}/{env}/{endpoint}
Authorization: Bearer {access_token}
apikey: {YOUR_API_KEY_FROM_SAP_API_HUB}
Content-Type: application/json
```
Two required headers: `Authorization` AND `apikey`.

`{env}` = `prod` or `sandbox`

### Key API Endpoints

**SBN Supplier API** — `https://openapi.ariba.com/api/sbn-supplier/v1/prod`

| Endpoint | Method | Purpose |
|---|---|---|
| `/suppliers/{anid}` | GET | Supplier profile |
| `/suppliers/{anid}/relationships` | GET | Buyer relationships |
| `/suppliers/{anid}/users` | GET | Supplier users/contacts |
| `/suppliers/{anid}/documents` | GET | Document exchange summary |

**Network Transaction API** — `https://openapi.ariba.com/api/network-transactions/v1/prod`

| Endpoint | Method | Purpose |
|---|---|---|
| `/ordersqueue` | GET | POs waiting for supplier |
| `/orders/{id}` | GET | PO details |
| `/invoices` | GET | Invoice list |
| `/shipnotices` | GET | ASNs |

**Supplier Registration API** — `https://openapi.ariba.com/api/supplier-registration/v1/prod`

| Endpoint | Method | Purpose |
|---|---|---|
| `/suppliers` | POST | Register new supplier |
| `/suppliers/{id}/status` | GET | Registration status |

### API Error Reference

| Error | Cause | Fix |
|---|---|---|
| `401 Unauthorized` | Expired/invalid token | Re-fetch token |
| `403 Forbidden` | App not subscribed | Subscribe on api.sap.com |
| `400 Bad Request` | Wrong grant_type or missing params | Check form body encoding |
| `invalid_client` | Wrong client_id/secret | Re-check app credentials |
| `429 Too Many Requests` | Rate limit (~10 req/sec) | Add exponential backoff |

### Registration Steps (one-time, human action required)
1. Go to `https://api.sap.com`
2. Find "SAP Business Network" in API catalog
3. Subscribe to: SAP Business Network Supplier API, SAP Business Network Document API
4. Create Application → copy `client_id`, `client_secret`, `API Key`

---

## 7. Architecture: Message Bus (background.js)

All extension pages communicate with `background.js` via `chrome.runtime.sendMessage`.

| Message Type | Purpose |
|---|---|
| `GET_PAGE_CONTEXT` | URL-based context detection |
| `SAVE_INTEGRATION` / `DELETE_INTEGRATION` | CRUD in chrome.storage.local |
| `AI_QUERY` | Local KB (no live API) |
| `GENERATE_TEST_PLAN` | Template-based plan gen |
| `GENERATE_IGW` | Integration Guide Workbook |
| `SCORE_READINESS` | Rule-based supplier readiness score |
| `DETECT_ERRORS` | Regex error pattern scan |
| `CONTEXT_DETECTED` | From content.js, stores + broadcasts ANID |
| `OPEN_SIDEPANEL` / `OPEN_TAB` | Window management |

**To-add for API layer:**
```javascript
'ARIBA_API_AUTH':     () => aribaApiAuth(msg.credentials).then(sendResponse),
'ARIBA_GET_SUPPLIER': () => aribaGetSupplier(msg.anid).then(sendResponse),
'ARIBA_GET_ORDERS':   () => aribaGetOrders(msg.anid).then(sendResponse),
```

---

## 8. Storage Schema (data/schema.js)

All data is `chrome.storage.local` — **entirely local, no sync to Ariba Network**.

| Key | Structure | Purpose |
|---|---|---|
| `suppliers` | Keyed by ANID | Per-stage task completion, mandatory docs |
| `buyers` | Keyed by buyer ID | Linked supplier ANIDs |
| `supplierMappings` | Per-ANID per-transaction-type | Mapping validation results |
| `settings` | Object | View prefs, last active supplier/buyer |
| `currentContext` | `{ anid, name, portal, url }` | Populated by content.js |

**For API credentials** — use `chrome.storage.session` (cleared on browser close):
```javascript
chrome.storage.session.set({
  aribaApiToken: token,
  aribaApiExpiry: expiry,
  aribaApiKey: apiKey
});
```
Never store raw passwords. Token only.

---

## 9. Platform Abstraction (aia-platform.js)

`window.AIA` provides unified APIs that work in both extension and standalone web app contexts:

```javascript
AIA.storage.get(keys)       // chrome.storage.local or localStorage fallback
AIA.storage.set(obj)
AIA.messaging.send(msg)     // chrome.runtime.sendMessage or in-memory event bus
AIA.messaging.onMessage(fn)
AIA.mode.get()              // 'sidepanel' | 'tab' | 'webapp'
AIA.context.detect()        // delegates to content script or manual entry
```

**Rule:** All cross-origin API calls must go through `background.js` (service worker). Use `AIA.messaging.send({ type: 'ARIBA_API_*' })` from sidepanel/content pages.

---

## 10. Content Script Context Detection (content.js)

6-strategy cascade to detect ANID and org name from Ariba pages:
1. `localStorage` — `sa.orgAnid`, `sa.orgName`, `sa.orgType`
2. URL params — `?anid=`, `?ANID=`, `?supplierId=`
3. URL path regex — `AN\d{8,14}`
4. Page body text scan (first 5000 chars)
5. DOM `data-anid` attributes
6. CSS selector scan for org name elements

---

## 11. Manifest Permissions

**Current `host_permissions`:**
```json
"https://*.ariba.com/*",
"https://service.ariba.com/*",
"https://integration.ariba.com/*",
"https://*.sap.com/*"
```

**Add for API access:**
```json
"https://api.ariba.com/*",
"https://openapi.ariba.com/*",
"https://sandbox.api.ariba.com/*"
```

---

## 12. WebMCP Portal — 6 Registered Tools

The web portal (`web/`) registers 6 tools via `navigator.tools.register()`:

| Tool | What it does |
|---|---|
| `list_purchase_orders` | All POs with readiness scores |
| `get_po_details` | Full PO + onboarding checklist |
| `generate_test_scenarios` | 3 cXML variants (split, no-part, ad-hoc) |
| `validate_cxml_document` | Schema + business rule validation |
| `get_integration_guide` | Excel IGW with EDI↔cXML mappings |
| `get_business_rules` | Transformation rules + fallbacks |

**Tech decisions:**
- WebMCP: Imperative API (`navigator.tools.register`) — NOT declarative
- COOP/COEP headers in `next.config.ts` + `vercel.json` (required for WebMCP)
- SAP Horizon colors: `--sap-blue: #0070F2`, `--sap-shell: #354A5E`
- No new npm deps
- Mock data mirrors Python backend — swap `BACKEND_URL` env var for live data

**Run locally:**
```bash
# Backend
cd aie-backend && uvicorn aie_server:app --port 8100 --reload

# Portal
cd web && BACKEND_URL=http://localhost:8100 npm run dev
# → http://localhost:3000
```

**Deploy:**
```bash
cd web && npx vercel --prod
```

---

## 13. API Module Blueprint (not yet built)

```javascript
// ariba-api.js — SAP Business Network API Client
const ARIBA_API = {
  AUTH_URL: 'https://api.ariba.com/v2/oauth/token',
  BASE_URL: 'https://openapi.ariba.com',
  _token: null,
  _tokenExpiry: 0,

  async getToken(clientId, clientSecret, username, password) {
    if (this._token && Date.now() < this._tokenExpiry - 60000) return this._token;
    const body = new URLSearchParams({ grant_type: 'password', client_id: clientId,
      client_secret: clientSecret, username, password });
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
      headers: { 'Authorization': `Bearer ${token}`, 'apikey': apiKey,
        'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
    return res.json();
  }
};
```

---

## 14. What's Complete vs What's Missing

### Done — Don't Rebuild
- `aia-platform.js` — use `AIA.messaging.send()` for background API calls
- `AIA.storage.get/set` — use for caching API responses
- ANID context detection in `content.js`
- Stage/task schema in `data/schema.js`
- Message routing in `background.js`
- cXML parser + sanitizer with r00–r16 rules
- Test Central 4-stage workflow (Value Prop → PO SAMPLE → Test Case → Tracker)
- WebMCP portal with 6 tools + mock data
- Python FastAPI backend with real cXML parsing

### Still Missing (prioritized)
1. `api.ariba.com` + `openapi.ariba.com` in `manifest.json` host_permissions
2. `ariba-api.js` — OAuth token fetch + API request wrapper
3. `ARIBA_API_AUTH`, `ARIBA_GET_SUPPLIER` message handlers in `background.js`
4. Credential input section in sidepanel UI (client_id, client_secret)
5. Token stored in `chrome.storage.session`
6. `CONTEXT_DETECTED` → auto-fetch supplier profile when token present
7. Live API data displayed in supplier dashboard

---

## 15. GitHub Repo

```
https://github.com/veerannas/ariba-integration-agent
```
Branch: `main` | License: MIT

⚠️ **Security constraint**: No Hyperspace API keys or SAP credentials must be committed. Credentials are runtime-only (`chrome.storage.session`).
