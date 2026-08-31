"use client";
import { useState } from "react";

const SCENARIOS = [
  {
    id: "multi-line-split",
    label: "Scenario 1: Multi-Line Split",
    badge: "Split",
    color: "var(--sap-blue)",
    description: "Single-item PO → 3 split lines with divided quantities",
    changes: [
      { type: "del", line: `<ItemOut lineNumber="1" quantity="10">` },
      { type: "add", line: `<ItemOut lineNumber="1" quantity="4">` },
      { type: "add", line: `  <Description>Enterprise Network Router (Split 1 of 3)</Description>` },
      { type: "ctx", line: `  <ItemID>...` },
      { type: "add", line: `</ItemOut>` },
      { type: "add", line: `<ItemOut lineNumber="2" quantity="3">` },
      { type: "add", line: `  <Description>Enterprise Network Router (Split 2 of 3)</Description>` },
      { type: "add", line: `</ItemOut>` },
      { type: "add", line: `<ItemOut lineNumber="3" quantity="3">` },
      { type: "add", line: `  <Description>Enterprise Network Router (Split 3 of 3)</Description>` },
      { type: "add", line: `</ItemOut>` },
    ],
  },
  {
    id: "no-supplier-part",
    label: "Scenario 2: No Supplier Part",
    badge: "No-Part",
    color: "var(--sap-warning)",
    description: "SupplierPartID removed — buyer-only identification",
    changes: [
      { type: "ctx", line: `<ItemID>` },
      { type: "del", line: `  <SupplierPartID>HW-ROUTER-900</SupplierPartID>` },
      { type: "ctx", line: `  <BuyerPartID>NET-RT-900</BuyerPartID>` },
      { type: "add", line: `  <!-- SupplierPartID removed — rule RULE-002 applied -->` },
      { type: "ctx", line: `</ItemID>` },
    ],
  },
  {
    id: "adhoc-shipto",
    label: "Scenario 3: Ad-hoc Ship-To",
    badge: "ADBUYER",
    color: "var(--sap-teal)",
    description: "Ship-To replaced with ADBUYER-prefixed ad-hoc address",
    changes: [
      { type: "ctx", line: `<ShipTo>` },
      { type: "del", line: `  <Address addressID="HQ_US_01">` },
      { type: "del", line: `    <Name>Acme Manufacturing Corp</Name>` },
      { type: "del", line: `    <Street>200 Main Street</Street>` },
      { type: "add", line: `  <Address addressID="ADBUYER-TEMP-001">` },
      { type: "add", line: `    <Name>ADBUYER - Temporary Project Site Alpha</Name>` },
      { type: "add", line: `    <Street>1200 Construction Blvd, Bldg C</Street>` },
      { type: "ctx", line: `    <City>...</City>` },
      { type: "ctx", line: `  </Address>` },
      { type: "ctx", line: `</ShipTo>` },
    ],
  },
];

const LINE_STYLES: Record<string, string> = {
  add: "diff-add",
  del: "diff-del",
  ctx: "diff-ctx",
};

const LINE_PREFIX: Record<string, string> = {
  add: "+ ",
  del: "- ",
  ctx: "  ",
};

export default function ScenarioPanel() {
  const [active, setActive] = useState(SCENARIOS[0].id);
  const scenario = SCENARIOS.find((s) => s.id === active)!;

  return (
    <div className="space-y-3">
      {/* Tab bar */}
      <div className="flex gap-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className="rounded px-3 py-1.5 text-xs font-semibold transition-all border"
            style={{
              background: active === s.id ? s.color : "var(--sap-surface)",
              color: active === s.id ? "#fff" : "var(--sap-text-2)",
              borderColor: active === s.id ? s.color : "var(--sap-border)",
            }}
          >
            {s.badge}
          </button>
        ))}
      </div>

      {/* Description */}
      <div className="rounded-md px-3 py-2 text-xs border-l-4"
           style={{ borderColor: scenario.color, background: "var(--sap-blue-light)", color: "var(--sap-text-2)" }}>
        <span className="font-semibold" style={{ color: "var(--sap-text-1)" }}>{scenario.label}:</span>{" "}
        {scenario.description}
      </div>

      {/* Diff view */}
      <div className="rounded-lg overflow-hidden border" style={{ borderColor: "var(--sap-border)" }}>
        <div className="px-3 py-1.5 border-b flex items-center justify-between"
             style={{ background: "var(--sap-shell)", borderColor: "transparent" }}>
          <span className="text-xs font-mono text-white">cXML diff</span>
          <span className="text-xs text-white/50">
            +{scenario.changes.filter((c) => c.type === "add").length} / -{scenario.changes.filter((c) => c.type === "del").length}
          </span>
        </div>
        <div className="overflow-auto max-h-52 font-mono text-xs leading-relaxed"
             style={{ background: "#1B2533" }}>
          {scenario.changes.map((c, i) => (
            <div
              key={i}
              className={`px-4 py-0.5 ${LINE_STYLES[c.type]}`}
              style={c.type === "ctx" ? { color: "#6A7A8A" } : undefined}
            >
              <span className="select-none mr-2" style={{ opacity: 0.5 }}>
                {LINE_PREFIX[c.type]}
              </span>
              {c.line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
