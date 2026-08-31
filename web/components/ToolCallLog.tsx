"use client";
import type { ToolCallEvent } from "@/lib/webmcp/tools";

interface Props {
  events: ToolCallEvent[];
}

const TOOL_COLOR: Record<string, string> = {
  list_purchase_orders:   "bg-blue-100 text-blue-800",
  get_po_details:         "bg-indigo-100 text-indigo-800",
  generate_test_scenarios:"bg-purple-100 text-purple-800",
  validate_cxml_document: "bg-amber-100 text-amber-800",
  get_integration_guide:  "bg-emerald-100 text-emerald-800",
  get_business_rules:     "bg-gray-100 text-gray-700",
};

export default function ToolCallLog({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-400">No agent tool calls yet.</p>
        <p className="text-xs text-gray-400 mt-1">
          Open this page in ChatGPT or use the WebMCP Inspector to trigger tools.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((e) => (
        <div key={e.id} className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className={`rounded px-2 py-0.5 text-xs font-mono font-semibold ${TOOL_COLOR[e.tool] ?? "bg-gray-100 text-gray-700"}`}>
              {e.tool}
            </span>
            <span className="text-xs text-gray-400">{e.durationMs}ms</span>
          </div>

          {Object.keys(e.params).length > 0 && (
            <pre className="mt-2 rounded bg-gray-50 p-2 text-xs text-gray-600 overflow-x-auto">
              {JSON.stringify(e.params, null, 2)}
            </pre>
          )}

          {e.error ? (
            <p className="mt-2 text-xs text-red-600">⚠ {e.error}</p>
          ) : (
            <pre className="mt-2 rounded bg-emerald-50 p-2 text-xs text-gray-700 overflow-x-auto max-h-32">
              {JSON.stringify(e.result, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
