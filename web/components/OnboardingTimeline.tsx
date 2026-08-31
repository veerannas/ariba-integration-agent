"use client";

const STAGES = [
  { n: 1, label: "Discovery",  desc: "ANID verify, connectivity assessment",  days: "1–2d",   color: "#0070F2", done: true  },
  { n: 2, label: "Config",     desc: "CIG setup, B2B test account, AS2",      days: "2–3d",   color: "#0070F2", done: true  },
  { n: 3, label: "Mapping",    desc: "EDI↔cXML field mapping, rules",         days: "3–5d",   color: "#0070F2", done: false, active: true },
  { n: 4, label: "Testing",    desc: "3-scenario test plan + sign-off",        days: "2–4d",   color: "#8C8C8C", done: false },
  { n: 5, label: "Go-Live",    desc: "Kickoff call, pilot supplier batch",     days: "1–2d",   color: "#8C8C8C", done: false },
  { n: 6, label: "Monitoring", desc: "Error detection, readiness scoring",     days: "ongoing", color: "#0FAAAA", done: false },
];

interface Props {
  activeStage?: number;
}

export default function OnboardingTimeline({ activeStage = 3 }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-0">
        {STAGES.map((s, i) => {
          const isActive  = s.n === activeStage;
          const isDone    = s.n < activeStage;
          const isLast    = i === STAGES.length - 1;

          return (
            <div key={s.n} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center flex-1 min-w-0">
                {/* Circle */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                  style={{
                    background: isDone ? "var(--sap-success)" : isActive ? "var(--sap-blue)" : "#D9D9D9",
                    color: isDone || isActive ? "#fff" : "var(--sap-text-3)",
                    boxShadow: isActive ? "0 0 0 3px rgba(0,112,242,0.25)" : undefined,
                  }}
                >
                  {isDone ? "✓" : s.n}
                </div>
                {/* Label */}
                <p
                  className="text-xs font-semibold mt-1 text-center truncate w-full px-1"
                  style={{ color: isActive ? "var(--sap-blue)" : isDone ? "var(--sap-success)" : "var(--sap-text-3)" }}
                >
                  {s.label}
                </p>
                <p className="text-xs text-center truncate w-full px-1"
                   style={{ color: "var(--sap-text-3)" }}>
                  {s.days}
                </p>
              </div>

              {/* Connector */}
              {!isLast && (
                <div
                  className="h-0.5 w-full shrink-0 mx-1"
                  style={{
                    background: isDone ? "var(--sap-success)" : "var(--sap-border)",
                    maxWidth: "24px",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Active stage detail */}
      {STAGES.filter((s) => s.n === activeStage).map((s) => (
        <div
          key={s.n}
          className="rounded-md px-3 py-2 text-xs border-l-4"
          style={{
            borderColor: "var(--sap-blue)",
            background: "var(--sap-blue-light)",
            color: "var(--sap-text-2)",
          }}
        >
          <span className="font-semibold" style={{ color: "var(--sap-text-1)" }}>
            Stage {s.n}: {s.label}
          </span>
          {" — "}{s.desc}
        </div>
      ))}
    </div>
  );
}
