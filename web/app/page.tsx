"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { registerAribaTools, type ToolCallEvent } from "@/lib/webmcp/tools";
import type { PurchaseOrder } from "@/lib/ariba/types";
import WebMCPBadge from "@/components/WebMCPBadge";
import POCard from "@/components/POCard";
import OnboardingChecklist from "@/components/OnboardingChecklist";
import ToolCallLog from "@/components/ToolCallLog";
import AgentPromptPanel from "@/components/AgentPromptPanel";
import CXMLViewer from "@/components/CXMLViewer";
import EDIMappingTable from "@/components/EDIMappingTable";
import ScenarioPanel from "@/components/ScenarioPanel";
import OnboardingTimeline from "@/components/OnboardingTimeline";

type DetailTab = "checklist" | "cxml" | "edi" | "scenarios" | "timeline";

export default function HomePage() {
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [toolEvents, setToolEvents] = useState<ToolCallEvent[]>([]);
  const [detailTab, setDetailTab] = useState<DetailTab>("checklist");
  const [sideTab, setSideTab] = useState<"prompts" | "log">("prompts");
  const [loading, setLoading] = useState(true);

  const addEvent = useCallback((e: ToolCallEvent) => {
    setToolEvents((prev) => [e, ...prev].slice(0, 50));
    setSideTab("log"); // auto-switch to log on agent call
  }, []);

  useEffect(() => {
    registerAribaTools(addEvent);
    fetch("/api/ariba/pos")
      .then((r) => r.json())
      .then((d) => {
        const list: PurchaseOrder[] = d.pos ?? [];
        setPOs(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .finally(() => setLoading(false));
  }, [addEvent]);

  const counts = {
    active:  pos.filter((p) => p.status === "active").length,
    testing: pos.filter((p) => p.status === "testing").length,
    error:   pos.filter((p) => p.status === "error").length,
    pending: pos.filter((p) => p.status === "pending").length,
  };

  const DETAIL_TABS: { id: DetailTab; label: string }[] = [
    { id: "checklist", label: "Checklist"  },
    { id: "timeline",  label: "Timeline"   },
    { id: "cxml",      label: "cXML"       },
    { id: "edi",       label: "EDI Mapping"},
    { id: "scenarios", label: "Scenarios"  },
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: "var(--sap-bg)" }}>

      {/* ── Shell header ── */}
      <header className="sap-shell shrink-0 flex items-center justify-between px-6 py-0 h-12">
        <div className="flex items-center gap-4 h-full">
          <div className="flex items-center gap-2 h-full border-r border-white/10 pr-4">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-white/20 text-white text-xs font-bold">
              A
            </div>
            <span className="text-white text-sm font-semibold">AribaFlow</span>
          </div>
          <span className="text-white/60 text-xs hidden sm:block">
            SAP Ariba Integration Portal
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/demo"
            className="text-xs text-white/70 hover:text-white transition-colors hidden sm:block">
            About →
          </Link>
          <WebMCPBadge />
        </div>
      </header>

      {/* ── Stats bar ── */}
      <div className="shrink-0 border-b px-6 py-1.5 flex items-center gap-6"
           style={{ background: "var(--sap-surface)", borderColor: "var(--sap-border)" }}>
        {(["active", "testing", "error", "pending"] as const).map((s) => (
          <span key={s} className="flex items-center gap-1.5 text-xs capitalize" style={{ color: "var(--sap-text-2)" }}>
            <span className={`h-2 w-2 rounded-full status-${s}`}
                  style={{ display: "inline-block", background:
                    s === "active"  ? "var(--sap-success)" :
                    s === "testing" ? "var(--sap-blue)" :
                    s === "error"   ? "var(--sap-error)" : "var(--sap-border-strong)"
                  }} />
            <span className="font-semibold" style={{ color: "var(--sap-text-1)" }}>{counts[s]}</span> {s}
          </span>
        ))}
        <span className="ml-auto text-xs" style={{ color: "var(--sap-text-3)" }}>
          {pos.length} purchase orders
        </span>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">

        {/* Left: PO list */}
        <aside className="w-72 shrink-0 flex flex-col border-r"
               style={{ background: "var(--sap-surface)", borderColor: "var(--sap-border)" }}>
          <div className="shrink-0 px-4 py-2.5 border-b"
               style={{ borderColor: "var(--sap-border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--sap-text-3)" }}>
              Purchase Orders
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-lg animate-pulse"
                       style={{ background: "var(--sap-bg)" }} />
                ))
              : pos.map((po) => (
                  <POCard
                    key={po.poNumber}
                    po={po}
                    selected={selected?.poNumber === po.poNumber}
                    onClick={() => setSelected(po)}
                  />
                ))
            }
          </div>
        </aside>

        {/* Center: Detail panel */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {selected ? (
            <>
              {/* Detail header */}
              <div className="shrink-0 px-6 py-4 border-b"
                   style={{ background: "var(--sap-surface)", borderColor: "var(--sap-border)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-base font-bold truncate" style={{ color: "var(--sap-text-1)" }}>
                      {selected.supplierName}
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: "var(--sap-text-2)" }}>
                      PO {selected.poNumber} · {selected.format} · ANID{" "}
                      <span className="font-mono">{selected.supplierAnid}</span>
                    </p>
                  </div>
                  <div className="flex gap-5 shrink-0">
                    {[
                      { label: "Readiness", value: `${selected.readinessScore}%`,
                        color: selected.readinessScore >= 80 ? "var(--sap-success)" :
                               selected.readinessScore >= 50 ? "var(--sap-warning)" : "var(--sap-error)" },
                      { label: "Amount",    value: `${selected.currency} ${selected.totalAmount.toLocaleString()}`, color: "var(--sap-text-1)" },
                      { label: "Items",     value: String(selected.itemCount), color: "var(--sap-text-1)" },
                    ].map((m) => (
                      <div key={m.label} className="text-right">
                        <p className="text-xs" style={{ color: "var(--sap-text-3)" }}>{m.label}</p>
                        <p className="text-sm font-bold" style={{ color: m.color }}>{m.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {selected.status === "error" && (
                  <div className="mt-3 rounded px-3 py-2 text-xs border-l-4"
                       style={{ borderColor: "var(--sap-error)", background: "var(--sap-error-bg)", color: "var(--sap-error)" }}>
                    Integration errors detected — use{" "}
                    <code className="font-mono font-semibold">validate_cxml_document</code>{" "}
                    or click &quot;Validate TechSupply PO&quot; in the prompt panel →
                  </div>
                )}

                {/* Readiness bar */}
                <div className="mt-3 h-1.5 rounded-full overflow-hidden"
                     style={{ background: "var(--sap-border)" }}>
                  <div className="h-full rounded-full transition-all"
                       style={{
                         width: `${selected.readinessScore}%`,
                         background: selected.readinessScore >= 80 ? "var(--sap-success)" :
                                     selected.readinessScore >= 50 ? "var(--sap-warning)" : "var(--sap-error)",
                       }} />
                </div>
              </div>

              {/* Detail tabs */}
              <div className="shrink-0 flex border-b px-6"
                   style={{ background: "var(--sap-surface)", borderColor: "var(--sap-border)" }}>
                {DETAIL_TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setDetailTab(t.id)}
                    className="px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors"
                    style={{
                      borderColor: detailTab === t.id ? "var(--sap-blue)" : "transparent",
                      color: detailTab === t.id ? "var(--sap-blue)" : "var(--sap-text-2)",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Detail content */}
              <div className="flex-1 overflow-y-auto p-6">
                {detailTab === "checklist" && <OnboardingChecklist />}
                {detailTab === "timeline"  && <OnboardingTimeline activeStage={3} />}
                {detailTab === "cxml"      && (
                  <CXMLViewer
                    title={`PO ${selected.poNumber} — OrderRequest`}
                    maxHeight="440px"
                  />
                )}
                {detailTab === "edi"       && <EDIMappingTable />}
                {detailTab === "scenarios" && <ScenarioPanel />}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm"
                 style={{ color: "var(--sap-text-3)" }}>
              Select a purchase order
            </div>
          )}
        </main>

        {/* Right: Agent panel */}
        <aside className="w-72 shrink-0 flex flex-col border-l"
               style={{ background: "var(--sap-surface)", borderColor: "var(--sap-border)" }}>
          {/* Tab bar */}
          <div className="shrink-0 flex border-b" style={{ borderColor: "var(--sap-border)" }}>
            {([
              { id: "prompts", label: "Agent Prompts"                          },
              { id: "log",     label: `Log (${toolEvents.length})`             },
            ] as const).map((t) => (
              <button
                key={t.id}
                onClick={() => setSideTab(t.id)}
                className="flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors"
                style={{
                  borderColor: sideTab === t.id ? "var(--sap-blue)" : "transparent",
                  color: sideTab === t.id ? "var(--sap-blue)" : "var(--sap-text-2)",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {sideTab === "prompts"
              ? <AgentPromptPanel onEvent={addEvent} />
              : <ToolCallLog events={toolEvents} />
            }
          </div>

          {/* Footer hint */}
          <div className="shrink-0 border-t px-3 py-2"
               style={{ borderColor: "var(--sap-border)" }}>
            <p className="text-xs" style={{ color: "var(--sap-text-3)" }}>
              6 WebMCP tools active.{" "}
              <Link href="/demo" className="underline" style={{ color: "var(--sap-blue)" }}>
                Setup guide
              </Link>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
