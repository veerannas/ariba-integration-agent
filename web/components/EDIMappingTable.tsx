"use client";
import { EDI_MAPPINGS } from "@/lib/ariba/edi-mappings";
import { useState } from "react";

export default function EDIMappingTable() {
  const [filter, setFilter] = useState<"all" | "required">("all");
  const [search, setSearch] = useState("");

  const rows = EDI_MAPPINGS.filter((m) => {
    if (filter === "required" && !m.required) return false;
    if (search) {
      const q = search.toLowerCase();
      return m.description.toLowerCase().includes(q) ||
             m.ediSegment.toLowerCase().includes(q) ||
             m.cxmlElement.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search fields…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded border px-3 py-1.5 text-xs outline-none focus:ring-2"
          style={{ borderColor: "var(--sap-border)", color: "var(--sap-text-1)" }}
        />
        <div className="flex rounded border overflow-hidden text-xs"
             style={{ borderColor: "var(--sap-border)" }}>
          {(["all", "required"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 font-medium capitalize transition-colors"
              style={{
                background: filter === f ? "var(--sap-blue)" : "var(--sap-surface)",
                color: filter === f ? "#fff" : "var(--sap-text-2)",
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="text-xs" style={{ color: "var(--sap-text-3)" }}>{rows.length} fields</span>
      </div>

      {/* Table */}
      <div className="rounded-lg overflow-hidden border" style={{ borderColor: "var(--sap-border)" }}>
        <div className="overflow-auto max-h-80">
          <table className="w-full text-xs">
            <thead className="sticky top-0">
              <tr style={{ background: "var(--sap-shell)", color: "#fff" }}>
                <th className="px-3 py-2 text-left font-semibold">cXML Path</th>
                <th className="px-3 py-2 text-left font-semibold">EDI Segment</th>
                <th className="px-3 py-2 text-left font-semibold">Element</th>
                <th className="px-3 py-2 text-left font-semibold">Description</th>
                <th className="px-3 py-2 text-left font-semibold">Example</th>
                <th className="px-3 py-2 text-center font-semibold">Req</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m, i) => (
                <tr
                  key={m.cxmlPath}
                  className="border-t"
                  style={{
                    background: i % 2 === 0 ? "var(--sap-surface)" : "#FAFAFA",
                    borderColor: "var(--sap-border)",
                  }}
                >
                  <td className="px-3 py-2 font-mono" style={{ color: "var(--sap-blue)" }}>
                    {m.cxmlPath}
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded px-1.5 py-0.5 font-mono font-semibold text-white"
                          style={{ background: "var(--sap-teal)" }}>
                      {m.ediSegment}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono" style={{ color: "var(--sap-text-2)" }}>
                    {m.ediElement}
                  </td>
                  <td className="px-3 py-2" style={{ color: "var(--sap-text-1)" }}>
                    {m.description}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs" style={{ color: "var(--sap-text-3)" }}>
                    {m.example}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {m.required ? (
                      <span className="text-xs font-bold" style={{ color: "var(--sap-error)" }}>✱</span>
                    ) : (
                      <span style={{ color: "var(--sap-text-3)" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
