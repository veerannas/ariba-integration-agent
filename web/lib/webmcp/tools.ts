import "./types"; // ensure global Navigator augmentation is loaded

export type ToolCallEvent = {
  id: string;
  tool: string;
  params: Record<string, unknown>;
  result?: unknown;
  error?: string;
  durationMs: number;
  ts: number;
};

type LogFn = (event: ToolCallEvent) => void;

export function registerAribaTools(onCall?: LogFn): boolean {
  if (typeof window === "undefined") return false;
  if (!("tools" in navigator) || !navigator.tools) {
    console.warn("[AribaFlow] WebMCP not available — enable chrome://flags/#enable-webmcp-testing");
    return false;
  }

  const t = navigator.tools;

  // ── 1. list_purchase_orders ───────────────────────────────────────────────
  t.register({
    name: "list_purchase_orders",
    description:
      "List all purchase orders in the Ariba integration system with supplier info, readiness score, and status.",
    parameters: { type: "object", properties: {}, required: [] },
    execute: async () => {
      const start = Date.now();
      const res = await fetch("/api/ariba/pos");
      const data = await res.json();
      onCall?.({ id: crypto.randomUUID(), tool: "list_purchase_orders", params: {}, result: data, durationMs: Date.now() - start, ts: start });
      return data;
    },
  });

  // ── 2. get_po_details ─────────────────────────────────────────────────────
  t.register({
    name: "get_po_details",
    description:
      "Get full details for a specific purchase order by PO number, including line items, supplier ANID, and onboarding checklist.",
    parameters: {
      type: "object",
      properties: {
        poNumber: { type: "string", description: "Purchase Order number, e.g. 7800459912" },
      },
      required: ["poNumber"],
    },
    execute: async ({ poNumber }) => {
      const start = Date.now();
      const res = await fetch(`/api/ariba/po/${poNumber}`);
      const data = await res.json();
      onCall?.({ id: crypto.randomUUID(), tool: "get_po_details", params: { poNumber }, result: data, durationMs: Date.now() - start, ts: start });
      return data;
    },
  });

  // ── 3. generate_test_scenarios ────────────────────────────────────────────
  t.register({
    name: "generate_test_scenarios",
    description:
      "Generate cXML test scenario variants from a base PO: Multi-Line Split, No Supplier Part, and Ad-hoc Ship-To. Returns scenario details and Excel Integration Guide status.",
    parameters: {
      type: "object",
      properties: {
        poNumber: { type: "string", description: "Base PO number to generate scenarios from" },
        scenarios: {
          type: "array",
          description: "Scenario IDs to generate. Defaults to all three if omitted.",
          items: { type: "string", enum: ["multi-line-split", "no-supplier-part", "adhoc-shipto"] },
        },
      },
      required: ["poNumber"],
    },
    execute: async ({ poNumber, scenarios }) => {
      const start = Date.now();
      const res = await fetch("/api/ariba/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poNumber, scenarios }),
      });
      const data = await res.json();
      onCall?.({ id: crypto.randomUUID(), tool: "generate_test_scenarios", params: { poNumber, scenarios }, result: data, durationMs: Date.now() - start, ts: start });
      return data;
    },
  });

  // ── 4. validate_cxml_document ─────────────────────────────────────────────
  t.register({
    name: "validate_cxml_document",
    description:
      "Validate a cXML document (OrderRequest, Invoice, ASN) against Ariba schema rules. Returns errors, warnings, and field count.",
    parameters: {
      type: "object",
      properties: {
        poNumber:     { type: "string",  description: "PO number to validate (uses stored cXML)" },
        documentType: { type: "string",  description: "Document type: OrderRequest, Invoice, ASN", enum: ["OrderRequest", "Invoice", "ASN"] },
        cxml:         { type: "string",  description: "Raw cXML string to validate (optional — overrides poNumber)" },
      },
      required: [],
    },
    execute: async (params) => {
      const start = Date.now();
      const res = await fetch("/api/ariba/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      onCall?.({ id: crypto.randomUUID(), tool: "validate_cxml_document", params, result: data, durationMs: Date.now() - start, ts: start });
      return data;
    },
  });

  // ── 5. get_integration_guide ──────────────────────────────────────────────
  t.register({
    name: "get_integration_guide",
    description:
      "Generate and retrieve the Excel Integration Guide Workbook (IGW) for a PO. Returns guide metadata and download link. The IGW contains cXML-to-EDI field mappings for all test scenarios.",
    parameters: {
      type: "object",
      properties: {
        poNumber: { type: "string", description: "PO number to generate the guide for" },
      },
      required: ["poNumber"],
    },
    execute: async ({ poNumber }) => {
      const start = Date.now();
      const res = await fetch(`/api/ariba/guide/${poNumber}`);
      const data = await res.json();
      onCall?.({ id: crypto.randomUUID(), tool: "get_integration_guide", params: { poNumber }, result: data, durationMs: Date.now() - start, ts: start });
      return data;
    },
  });

  // ── 6. get_business_rules ─────────────────────────────────────────────────
  t.register({
    name: "get_business_rules",
    description:
      "Retrieve the Ariba integration business rules: transformation triggers, field mapping fallbacks, address handling, currency validation, and control key logic.",
    parameters: { type: "object", properties: {}, required: [] },
    execute: async () => {
      const start = Date.now();
      const res = await fetch("/api/ariba/rules");
      const data = await res.json();
      onCall?.({ id: crypto.randomUUID(), tool: "get_business_rules", params: {}, result: data, durationMs: Date.now() - start, ts: start });
      return data;
    },
  });

  console.info("[AribaFlow] ✅ 6 WebMCP tools registered — agents can now call Ariba integration tools on this page.");
  return true;
}
