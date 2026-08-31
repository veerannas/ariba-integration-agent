import Link from "next/link";

const PROMPTS = [
  { label: "List all POs",           prompt: "List all purchase orders and show their readiness scores" },
  { label: "Validate TechSupply",    prompt: "Validate the cXML document for PO 7800459913 and explain any errors" },
  { label: "Generate scenarios",     prompt: "Generate all three test scenarios for PO 7800459912" },
  { label: "Get business rules",     prompt: "What business rules apply to Ariba integration?" },
  { label: "Integration guide",      prompt: "Generate the integration guide for PO 7800459912" },
  { label: "Check Acme status",      prompt: "Get full details for PO 7800459912 including the onboarding checklist" },
];

const STAGES = [
  { n: "1", label: "Discovery",   desc: "Identify supplier, verify ANID, assess connectivity",  days: "1–2d"  },
  { n: "2", label: "Config",      desc: "CIG connection, B2B test account, AS2/HTTPS setup",    days: "2–3d"  },
  { n: "3", label: "Mapping",     desc: "EDI↔cXML field mapping, business rule configuration",  days: "3–5d"  },
  { n: "4", label: "Testing",     desc: "3-scenario test plan: split, no-part, ad-hoc ship-to", days: "2–4d"  },
  { n: "5", label: "Go-Live",     desc: "Integration guide sign-off, kickoff call, pilot batch", days: "1–2d" },
  { n: "6", label: "Monitoring",  desc: "Error detection, readiness scoring, escalation",        days: "ongoing"},
];

const TOOLS = [
  { name: "list_purchase_orders",    desc: "List POs with readiness scores" },
  { name: "get_po_details",          desc: "Full PO + checklist" },
  { name: "generate_test_scenarios", desc: "cXML variant generation" },
  { name: "validate_cxml_document",  desc: "Schema + business rule check" },
  { name: "get_integration_guide",   desc: "Excel IGW with EDI↔cXML mappings" },
  { name: "get_business_rules",      desc: "Transformation rules + fallbacks" },
];

export default function DemoPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--sap-bg)" }}>

      {/* Shell header */}
      <header className="sap-shell px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-white/20 text-white text-xs font-bold">
            AIA
          </div>
          <span className="text-white font-semibold">AribaFlow</span>
          <span className="text-white/50 text-sm">— SAP Ariba Integration Portal</span>
        </div>
        <Link
          href="/"
          className="rounded px-4 py-1.5 text-sm font-medium text-white bg-white/15 hover:bg-white/25 transition-colors"
        >
          Open Portal →
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-16">

        {/* Hero */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
               style={{ background: "var(--sap-blue-light)", color: "var(--sap-blue)" }}>
            <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
            WebMCP Challenge Submission
          </div>
          <h1 className="text-4xl font-bold" style={{ color: "var(--sap-text-1)" }}>
            Supplier onboarding:<br />
            <span style={{ color: "var(--sap-blue)" }}>120 days → 14 days</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--sap-text-2)" }}>
            AribaFlow is a WebMCP-powered procurement portal where AI agents handle
            the 80% of SAP Ariba integration work that&apos;s repetitive — EDI mapping,
            cXML validation, scenario generation — while humans own sign-off.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link href="/"
              className="rounded px-6 py-2.5 text-sm font-semibold text-white transition-colors"
              style={{ background: "var(--sap-blue)" }}>
              Open Portal
            </Link>
            <a href="https://github.com/veerannas/ariba-integration-agent"
               target="_blank" rel="noopener noreferrer"
               className="rounded px-6 py-2.5 text-sm font-semibold border transition-colors hover:bg-gray-50"
               style={{ borderColor: "var(--sap-border)", color: "var(--sap-text-1)" }}>
              View Source
            </a>
          </div>
        </section>

        {/* Problem / Solution */}
        <section>
          <h2 className="text-xl font-bold mb-6" style={{ color: "var(--sap-text-1)" }}>The Problem</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="horizon-card p-6" style={{ borderLeft: "4px solid var(--sap-error)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--sap-error)" }}>Before AribaFlow</p>
              <ul className="space-y-2 text-sm" style={{ color: "var(--sap-text-2)" }}>
                <li>⏱ 30–120 days per supplier onboarding</li>
                <li>📋 100+ manual touchpoints per supplier</li>
                <li>🚧 5–10 concurrent onboardings max</li>
                <li>🔁 EDI mapping: 70% manual effort</li>
                <li>📧 Email-based coordination & errors</li>
              </ul>
            </div>
            <div className="horizon-card p-6" style={{ borderLeft: "4px solid var(--sap-success)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--sap-success)" }}>After AribaFlow + WebMCP</p>
              <ul className="space-y-2 text-sm" style={{ color: "var(--sap-text-2)" }}>
                <li>⚡ 7–14 days per supplier onboarding</li>
                <li>🤖 Agent handles repetitive touchpoints</li>
                <li>🚀 100+ parallel onboardings</li>
                <li>✅ EDI mapping automated via tools</li>
                <li>👤 Human owns governance & sign-off</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 6-stage pipeline */}
        <section>
          <h2 className="text-xl font-bold mb-6" style={{ color: "var(--sap-text-1)" }}>Integration Pipeline</h2>
          <div className="grid grid-cols-6 gap-2">
            {STAGES.map((s, i) => (
              <div key={s.n} className="horizon-card p-3 text-center relative">
                {i < STAGES.length - 1 && (
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-gray-300 text-lg">›</div>
                )}
                <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 text-white text-xs font-bold"
                     style={{ background: i < 5 ? "var(--sap-blue)" : "var(--sap-teal)" }}>
                  {s.n}
                </div>
                <p className="text-xs font-semibold" style={{ color: "var(--sap-text-1)" }}>{s.label}</p>
                <p className="text-xs mt-1" style={{ color: "var(--sap-blue)" }}>{s.days}</p>
                <p className="text-xs mt-1 leading-tight" style={{ color: "var(--sap-text-3)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* WebMCP tools */}
        <section>
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--sap-text-1)" }}>6 WebMCP Tools</h2>
          <p className="text-sm mb-6" style={{ color: "var(--sap-text-2)" }}>
            Open the portal in ChatGPT&apos;s in-app browser or Chrome with{" "}
            <code className="rounded px-1 py-0.5 text-xs font-mono" style={{ background: "var(--sap-blue-light)", color: "var(--sap-blue)" }}>
              chrome://flags/#enable-webmcp-testing
            </code>{" "}
            and try these prompts:
          </p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {TOOLS.map((t) => (
              <div key={t.name} className="horizon-card p-3 flex items-start gap-3">
                <span className="mt-0.5 h-2 w-2 rounded-full shrink-0" style={{ background: "var(--sap-blue)" }} />
                <div>
                  <p className="text-xs font-mono font-semibold" style={{ color: "var(--sap-blue)" }}>{t.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--sap-text-2)" }}>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Sample prompts */}
          <div className="horizon-card p-5" style={{ borderTop: "3px solid var(--sap-blue)" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--sap-text-2)" }}>
              Sample Agent Prompts
            </p>
            <div className="space-y-2">
              {PROMPTS.map((p) => (
                <div key={p.label} className="flex items-center gap-3 rounded p-2.5 text-sm"
                     style={{ background: "var(--sap-blue-light)" }}>
                  <span className="shrink-0 rounded px-2 py-0.5 text-xs font-semibold text-white"
                        style={{ background: "var(--sap-blue)" }}>
                    {p.label}
                  </span>
                  <span className="italic" style={{ color: "var(--sap-text-2)" }}>&quot;{p.prompt}&quot;</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section>
          <h2 className="text-xl font-bold mb-6" style={{ color: "var(--sap-text-1)" }}>How WebMCP Works Here</h2>
          <div className="horizon-card p-6 font-mono text-sm space-y-3" style={{ background: "#1B2533", color: "#E0E8F0", border: "none" }}>
            <div><span style={{ color: "#6A9FD8" }}>// Registered on page load via Imperative API</span></div>
            <div><span style={{ color: "#0FAAAA" }}>navigator</span><span style={{ color: "#D4D4D4" }}>.</span><span style={{ color: "#9CDCFE" }}>tools</span><span style={{ color: "#D4D4D4" }}>.</span><span style={{ color: "#DCDCAA" }}>register</span><span style={{ color: "#D4D4D4" }}>({"{"}</span></div>
            <div className="pl-4"><span style={{ color: "#9CDCFE" }}>name</span><span style={{ color: "#D4D4D4" }}>:</span> <span style={{ color: "#CE9178" }}>&quot;validate_cxml_document&quot;</span><span style={{ color: "#D4D4D4" }}>,</span></div>
            <div className="pl-4"><span style={{ color: "#9CDCFE" }}>description</span><span style={{ color: "#D4D4D4" }}>:</span> <span style={{ color: "#CE9178" }}>&quot;Validate against Ariba schema + business rules&quot;</span><span style={{ color: "#D4D4D4" }}>,</span></div>
            <div className="pl-4"><span style={{ color: "#9CDCFE" }}>execute</span><span style={{ color: "#D4D4D4" }}>: </span><span style={{ color: "#569CD6" }}>async</span> <span style={{ color: "#D4D4D4" }}>({"{"} </span><span style={{ color: "#9CDCFE" }}>poNumber</span><span style={{ color: "#D4D4D4" }}> {"}"}) =&gt; {"{"}</span></div>
            <div className="pl-8"><span style={{ color: "#C586C0" }}>return</span> <span style={{ color: "#569CD6" }}>await</span> <span style={{ color: "#DCDCAA" }}>fetch</span><span style={{ color: "#D4D4D4" }}>(`/api/ariba/validate`, {"{ method: 'POST', body: ... }"})</span></div>
            <div className="pl-4"><span style={{ color: "#D4D4D4" }}>{"}"}</span></div>
            <div><span style={{ color: "#D4D4D4" }}>{"})"}</span></div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center pt-4">
          <Link href="/"
            className="inline-flex items-center gap-2 rounded px-8 py-3 text-base font-semibold text-white transition-colors"
            style={{ background: "var(--sap-blue)" }}>
            Open the Portal →
          </Link>
          <p className="mt-3 text-xs" style={{ color: "var(--sap-text-3)" }}>
            Enable WebMCP in Chrome or open in ChatGPT&apos;s in-app browser
          </p>
        </section>

      </main>
    </div>
  );
}
