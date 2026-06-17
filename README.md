# Ariba Integration Agent — SAP Business Network Integration Assistant

Ariba Integration Agent (AIA) is a Chrome Extension (Manifest V3, v3.2.0) that accelerates supplier onboarding and EDI/cXML integration on the SAP Business Network. It provides an intelligent side panel that guides integration consultants and suppliers through the complete B2B connectivity setup — from initial onboarding stage tracking through field mapping validation, test plan generation, and Integration Guide Workbook (IGW) creation. The extension injects directly into Ariba Network pages, detecting context (supplier ANID, portal section) and surfacing relevant guidance automatically.

The agent operates with a local-first architecture: all business rules, mapping logic, and AI knowledge base run within the extension without external API calls. It supports EDI X12 ↔ cXML bidirectional field mapping across all major transaction types (850/855/856/810/820), automated error detection on Ariba UI5 pages, supplier readiness scoring, and Excel-based IGW generation. A Python retrieval backend provides enhanced document search across integration templates, business rules, and master data.

## Features & Modules

| Module | Description |
|--------|-------------|
| **Supplier Onboarding Pipeline** | 6-stage tracking (Discovery → Config → Mapping → Testing → Go-Live → Monitoring) |
| **EDI ↔ cXML Mapping Engine** | Bidirectional field mapping for X12 850/855/856/810/820 transactions |
| **cXML Guide Engine** | Parse and validate cXML documents against Ariba schemas |
| **EDI Guide Engine** | EDI X12 segment/element reference and validation |
| **cXML Anonymizer** | Strip sensitive data from cXML documents for sharing |
| **Transaction Store** | Local B2B transaction storage and replay |
| **Error Detection** | Auto-scan Ariba SAP UI5 DOM for integration errors with fix suggestions |
| **Test Plan Generator** | Template-based test plan creation per transaction type |
| **IGW Generator** | Integration Guide Workbook (Excel) generation with mapping details |
| **Readiness Scoring** | Rule-based supplier integration readiness assessment |
| **AI Knowledge Base** | Local rule-based Q&A for Ariba integration guidance |
| **Context Detection** | 6-strategy ANID/org detection from Ariba Network pages |
| **Retrieval Backend** | Python server for document search (templates, business rules, master data) |
| **Tab/Panel Modes** | Side panel + full-tab view for wider workspace |

## Architecture

```
sidepanel.js (~3000 lines)     ← Main UI controller: nav, tabs, all panel logic
  ├── cxml-guide-engine.js     ← cXML document parsing and validation
  ├── edi-guide-engine.js      ← EDI X12 segment reference
  ├── cxml-anonymizer.js       ← Sensitive data stripping
  ├── transaction-store.js     ← Local B2B transaction management
  └── data/mapping-rules.json  ← Deterministic conversion rules, UoM, N9 patterns
background.js                  ← Service worker: message router, AI KB, generators
content.js                     ← Injected into *.ariba.com: FAB, context detection, error scan
aia-platform.js                ← Environment abstraction (extension vs web app)
aie-backend/
  ├── aie_server.py            ← Python retrieval server
  ├── aie_retrieval.py         ← Document search engine
  └── data/                    ← Templates, business rules, master data, sample cXML
```

## Tech Stack

- Chrome Extension Manifest V3 (no bundler)
- Vanilla JavaScript (IIFE module pattern)
- Python 3 (retrieval backend)
- SheetJS (Excel generation for IGW)
- JSZip (archive handling)
- chrome.storage.local (all state)
- Chrome Side Panel API
