# AribaFlow — Session Handover

## What Was Built
WebMCP-powered SAP Ariba Integration Portal for the [WebMCP Challenge](https://webmcp.devpost.com/) ($3K prize).

**Concept:** AI agents + procurement teams onboard suppliers 10× faster (120 days → 14 days) via 6 WebMCP tools registered on a hosted web portal.

---

## Repo
```
/Users/D068941/Desktop/ariba-integration-agent/
```
- **Chrome Extension** (v4.1.1) — existing, Manifest V3, `manifest.json`, `background.js`, etc.
- **Python backend** — `aie-backend/aie_server.py` (FastAPI, port 8100) — real cXML parsing, scenario gen, Excel IGW
- **Web portal** — `web/` — Next.js 16, the WebMCP submission

---

## Web Portal Structure (`web/`)
```
app/
  page.tsx          ← main portal (3-col: PO list · detail tabs · agent panel)
  demo/page.tsx     ← /demo landing page for judges
  api/ariba/        ← 6 API routes (proxy to :8100 if BACKEND_URL set, else mock)
    pos/            validate/   scenarios/   po/[id]/   guide/[id]/   rules/
components/
  POCard            WebMCPBadge     OnboardingChecklist   ToolCallLog
  AgentPromptPanel  CXMLViewer      EDIMappingTable       ScenarioPanel   OnboardingTimeline
lib/
  webmcp/tools.ts   ← 6 navigator.tools.register() calls
  ariba/mock.ts     ← 5 mock POs, 3 scenarios, 13-step checklist
  ariba/edi-mappings.ts ← 19 EDI X12 850 ↔ cXML field mappings
```

## 6 WebMCP Tools
| Tool | What it does |
|---|---|
| `list_purchase_orders` | All POs with readiness scores |
| `get_po_details` | Full PO + onboarding checklist |
| `generate_test_scenarios` | 3 cXML variants (split, no-part, ad-hoc) |
| `validate_cxml_document` | Schema + business rule validation |
| `get_integration_guide` | Excel IGW with EDI↔cXML mappings |
| `get_business_rules` | Transformation rules + fallbacks |

---

## ⚠️ One Pending Action — Vercel Login
Temporary deployment **expired** (was never claimed). Need to log in once:

```bash
cd /Users/D068941/Desktop/ariba-integration-agent/web
npx vercel login
# → opens https://vercel.com/oauth/device?... in browser → authorize
npx vercel --prod
# → get live URL → paste into Devpost submission
```

Local dev works fine:
```bash
cd /Users/D068941/Desktop/ariba-integration-agent/web && npm run dev
# → http://localhost:3000
```

With real Python backend:
```bash
# Terminal 1
cd /Users/D068941/Desktop/ariba-integration-agent/aie-backend
uvicorn aie_server:app --port 8100 --reload

# Terminal 2
cd /Users/D068941/Desktop/ariba-integration-agent/web
BACKEND_URL=http://localhost:8100 npm run dev
```

---

## Devpost Submission (partially filled)
- **Tagline:** "Supplier onboarding: 120 days → 14. AI agents handle EDI mapping, CIG testing & integration guides via WebMCP. Humans own sign-off. Everyone moves faster."
- **Live URL:** https://web-lake-theta-naotcap2uu.vercel.app (alias) / https://web-d51sdxhxq-veeranna1.vercel.app (direct)
- **Repo:** https://github.com/veerannas/ariba-integration-agent (must be public + MIT license)
- **"About the project"**, **Built With**, **Testing instructions** → already drafted (ask previous session or check conversation)
- **Agents tested with:** ChatGPT in-app browser, Chrome WebMCP flag, WebMCP Inspector extension

---

## Key Tech Decisions
- WebMCP: Imperative API (`navigator.tools.register`) — NOT declarative
- COOP/COEP headers set in `next.config.ts` + `vercel.json` (required for WebMCP)
- SAP Horizon design system colors (`--sap-blue: #0070F2`, `--sap-shell: #354A5E`)
- No new npm deps — all pure TS/CSS
- Mock data mirrors exact structure of Python backend — swap `BACKEND_URL` env var for real data

---

## Build Status
```
✓ npm run build — 0 errors, 9 routes
✓ TypeScript clean
```
Version: `web@2.0.0`
