"use client";
import { useState } from "react";
import type { ToolCallEvent } from "@/lib/webmcp/tools";

interface Prompt {
  label: string;
  tool: string;
  params: Record<string, unknown>;
  description: string;
}

const PROMPTS: Prompt[] = [
  {
    label: "List all POs",
    tool: "list_purchase_orders",
    params: {},
    description: "Show all purchase orders with supplier info and readiness scores",
  },
  {
    label: "Validate TechSupply PO",
    tool: "validate_cxml_document",
    params: { poNumber: "7800459913", documentType: "Invoice" },
    description: "Validate PO 7800459913 — expect ANID_MISMATCH error",
  },
  {
    label: "Generate scenarios",
    tool: "generate_test_scenarios",
    params: { poNumber: "7800459912" },
    description: "Generate 3 cXML test variants from base PO 7800459912",
  },
  {
    label: "Get business rules",
    tool: "get_business_rules",
    params: {},
    description: "Fetch all Ariba integration transformation rules",
  },
  {
    label: "Integration guide",
    tool: "get_integration_guide",
    params: { poNumber: "7800459912" },
    description: "Generate Excel IGW with full EDI↔cXML field mappings",
  },
  {
    label: "PO details + checklist",
    tool: "get_po_details",
    params: { poNumber: "7800459912" },
    description: "Full details for Acme Manufacturing including onboarding status",
  },
];

interface Props {
  onEvent: (e: ToolCallEvent) => void;
}

export default function AgentPromptPanel({ onEvent }: Props) {
  const [running, setRunning] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ label: string; ok: boolean } | null>(null);

  async function runPrompt(p: Prompt) {
    if (running) return;
    setRunning(p.tool);
    const start = Date.now();

    try {
      // Build fetch target from tool name
      const urlMap: Record<string, { url: string; method: string; body?: string }> = {
        list_purchase_orders:    { url: "/api/ariba/pos",                    method: "GET" },
        get_po_details:          { url: `/api/ariba/po/${p.params.poNumber}`, method: "GET" },
        generate_test_scenarios: { url: "/api/ariba/scenarios",              method: "POST", body: JSON.stringify(p.params) },
        validate_cxml_document:  { url: "/api/ariba/validate",               method: "POST", body: JSON.stringify(p.params) },
        get_integration_guide:   { url: `/api/ariba/guide/${p.params.poNumber}`, method: "GET" },
        get_business_rules:      { url: "/api/ariba/rules",                  method: "GET" },
      };

      const req = urlMap[p.tool];
      if (!req) throw new Error(`Unknown tool: ${p.tool}`);

      const res = await fetch(req.url, {
        method: req.method,
        headers: req.body ? { "Content-Type": "application/json" } : undefined,
        body: req.body,
      });
      const result = await res.json();

      const event: ToolCallEvent = {
        id: crypto.randomUUID(),
        tool: p.tool,
        params: p.params,
        result,
        durationMs: Date.now() - start,
        ts: start,
      };
      onEvent(event);
      setLastResult({ label: p.label, ok: true });
    } catch (err) {
      const event: ToolCallEvent = {
        id: crypto.randomUUID(),
        tool: p.tool,
        params: p.params,
        error: String(err),
        durationMs: Date.now() - start,
        ts: start,
      };
      onEvent(event);
      setLastResult({ label: p.label, ok: false });
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--sap-text-2)" }}>
          Try agent prompts
        </p>
        {lastResult && (
          <span className={`text-xs font-medium ${lastResult.ok ? "text-green-600" : "text-red-600"}`}>
            {lastResult.ok ? "✓" : "✗"} {lastResult.label}
          </span>
        )}
      </div>

      {PROMPTS.map((p) => (
        <button
          key={p.tool}
          onClick={() => runPrompt(p)}
          disabled={!!running}
          className="w-full text-left rounded-md border p-3 transition-all hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            borderColor: running === p.tool ? "var(--sap-blue)" : "var(--sap-border)",
            background: running === p.tool ? "var(--sap-blue-light)" : "var(--sap-surface)",
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold" style={{ color: "var(--sap-text-1)" }}>
              {p.label}
            </span>
            {running === p.tool ? (
              <span className="text-xs" style={{ color: "var(--sap-blue)" }}>running…</span>
            ) : (
              <span className="text-xs" style={{ color: "var(--sap-text-3)" }}>▶</span>
            )}
          </div>
          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--sap-text-3)" }}>
            {p.description}
          </p>
          <p className="text-xs mt-1 font-mono" style={{ color: "var(--sap-blue)" }}>
            {p.tool}
          </p>
        </button>
      ))}
    </div>
  );
}
