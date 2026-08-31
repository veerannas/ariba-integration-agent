"use client";
import type { OnboardingChecklist } from "@/lib/ariba/types";
import { MOCK_CHECKLIST } from "@/lib/ariba/mock";

const STATUS_ICON: Record<OnboardingChecklist["status"], string> = {
  complete:    "✅",
  "in-progress": "🔄",
  pending:     "○",
  blocked:     "🚫",
};

const STATUS_TEXT: Record<OnboardingChecklist["status"], string> = {
  complete:    "text-emerald-700",
  "in-progress": "text-blue-700 font-semibold",
  pending:     "text-gray-400",
  blocked:     "text-red-600",
};

const OWNER_BADGE: Record<OnboardingChecklist["owner"], string> = {
  SI:       "bg-indigo-100 text-indigo-700",
  SIFL:     "bg-purple-100 text-purple-700",
  NDL:      "bg-gray-100 text-gray-600",
  Supplier: "bg-orange-100 text-orange-700",
};

interface Props {
  checklist?: OnboardingChecklist[];
}

export default function OnboardingChecklist({ checklist = MOCK_CHECKLIST }: Props) {
  const complete = checklist.filter((s) => s.status === "complete").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">SI/SIFL Onboarding Workflow</h3>
        <span className="text-xs text-gray-500">{complete}/{checklist.length} steps</span>
      </div>

      <div className="space-y-1">
        {checklist.map((step) => (
          <div
            key={step.step}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-xs ${
              step.status === "in-progress" ? "bg-blue-50" : "hover:bg-gray-50"
            }`}
          >
            <span className="w-4 shrink-0 text-center">{STATUS_ICON[step.status]}</span>
            <span className="w-4 shrink-0 text-gray-400 font-mono">{step.step}</span>
            <span className={`flex-1 ${STATUS_TEXT[step.status]}`}>{step.title}</span>
            <span className={`shrink-0 rounded px-1.5 py-0.5 font-medium ${OWNER_BADGE[step.owner]}`}>
              {step.owner}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
