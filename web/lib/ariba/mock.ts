import type { PurchaseOrder, TestScenario, ValidationResult, OnboardingChecklist } from "./types";

// ---------------------------------------------------------------------------
// Mock data — mirrors aie-backend real data structures exactly.
// In dev: API routes proxy to http://localhost:8100 (BACKEND_URL env var).
// In production (Vercel): these mocks are served directly.
// ---------------------------------------------------------------------------

export const MOCK_POS: PurchaseOrder[] = [
  {
    poNumber: "7800459912",
    supplierAnid: "AN99000010001-T",
    supplierName: "Acme Manufacturing Corp",
    buyerAnid: "AN99000020002-T",
    buyerName: "Global Buyer Inc",
    totalAmount: 12750.0,
    currency: "USD",
    orderDate: "2026-08-15",
    status: "testing",
    readinessScore: 85,
    itemCount: 4,
    format: "cXML",
  },
  {
    poNumber: "7800459913",
    supplierAnid: "AN02000000001-T",
    supplierName: "TechSupply GmbH",
    buyerAnid: "AN99000020002-T",
    buyerName: "Global Buyer Inc",
    totalAmount: 3100.0,
    currency: "EUR",
    orderDate: "2026-08-20",
    status: "error",
    readinessScore: 45,
    itemCount: 2,
    format: "EDI-X12",
  },
  {
    poNumber: "7800459914",
    supplierAnid: "AN02000000002-T",
    supplierName: "Global Parts Ltd",
    buyerAnid: "AN99000020002-T",
    buyerName: "Global Buyer Inc",
    totalAmount: 8400.0,
    currency: "USD",
    orderDate: "2026-08-22",
    status: "testing",
    readinessScore: 70,
    itemCount: 6,
    format: "cXML",
  },
  {
    poNumber: "7800459915",
    supplierAnid: "AN02000000003-T",
    supplierName: "Precision Tools Co",
    buyerAnid: "AN99000020002-T",
    buyerName: "Global Buyer Inc",
    totalAmount: 950.0,
    currency: "USD",
    orderDate: "2026-08-28",
    status: "pending",
    readinessScore: 20,
    itemCount: 1,
    format: "cXML",
  },
  {
    poNumber: "7800459916",
    supplierAnid: "AN02000000004-T",
    supplierName: "FastShip Logistics",
    buyerAnid: "AN99000020002-T",
    buyerName: "Global Buyer Inc",
    totalAmount: 6200.0,
    currency: "USD",
    orderDate: "2026-07-10",
    status: "active",
    readinessScore: 100,
    itemCount: 3,
    format: "EDI-X12",
  },
];

export const MOCK_SCENARIOS: TestScenario[] = [
  {
    id: "multi-line-split",
    name: "Scenario 1: Multi-Line Split",
    description: "Single-item PO expanded to multiple line items with split quantities",
    items: 3,
    size: 4200,
    status: "generated",
  },
  {
    id: "no-supplier-part",
    name: "Scenario 2: No Supplier Part Number",
    description: "SupplierPartID removed — buyer-only identification",
    items: 4,
    size: 3800,
    status: "generated",
  },
  {
    id: "adhoc-shipto",
    name: "Scenario 3: Ad-hoc Ship-To (ADBUYER)",
    description: "Ship-To address replaced with ADBUYER-prefixed ad-hoc address",
    items: 4,
    size: 4100,
    status: "generated",
  },
];

export const MOCK_CHECKLIST: OnboardingChecklist[] = [
  { step: 1,  title: "NDL establishes B2B test account",              owner: "NDL",      status: "complete"     },
  { step: 2,  title: "SIFL creates and shares test plan",             owner: "SIFL",     status: "complete"     },
  { step: 3,  title: "SI establishes CIG connection to B2B account",  owner: "SI",       status: "complete"     },
  { step: 4,  title: "SI reviews documents in Business Network",      owner: "SI",       status: "complete"     },
  { step: 5,  title: "SI requests additional documents for testing",  owner: "SI",       status: "in-progress"  },
  { step: 6,  title: "SIFL sends documents for testing",              owner: "SIFL",     status: "pending"      },
  { step: 7,  title: "SI completes testing",                          owner: "SI",       status: "pending"      },
  { step: 8,  title: "SIFL validates testing",                        owner: "SIFL",     status: "pending"      },
  { step: 9,  title: "SI creates integration guides from test material", owner: "SI",    status: "pending"      },
  { step: 10, title: "SIFL signs off integration guides",             owner: "SIFL",     status: "pending"      },
  { step: 11, title: "SIFL completes the word document",              owner: "SIFL",     status: "pending"      },
  { step: 12, title: "SI creates Kickoff Deck",                       owner: "SI",       status: "pending"      },
  { step: 13, title: "Integration Guides reviewed with pilot suppliers on kickoff call", owner: "Supplier", status: "pending" },
];

export const MOCK_VALIDATION: ValidationResult = {
  valid: true,
  errors: [],
  warnings: [
    { code: "WARN-001", message: "SupplierPartID present but BuyerPartID missing on line 2", path: "ItemOut[2]/ItemID" },
    { code: "WARN-002", message: "PaymentTerm not specified — defaulting to NET30",           path: "OrderRequestHeader" },
  ],
  fieldCount: 48,
  documentType: "OrderRequest (PO 850)",
};

export const MOCK_VALIDATION_ERROR: ValidationResult = {
  valid: false,
  errors: [
    { code: "ANID_MISMATCH", message: "Supplier ANID AN02000000001-T does not match buyer vendor record", path: "Header/From/Credential" },
    { code: "MAP_FIELD_MISSING", message: "Required field UnitOfMeasure missing on line item 1", path: "ItemOut[1]/UnitOfMeasure" },
  ],
  warnings: [
    { code: "WARN-003", message: "Currency EUR — verify supplier accepts EUR invoicing", path: "Total/Money@currency" },
  ],
  fieldCount: 31,
  documentType: "Invoice (810 / InvoiceDetailRequest)",
};
