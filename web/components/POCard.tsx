"use client";
import type { PurchaseOrder } from "@/lib/ariba/types";

const STATUS_STYLES: Record<PurchaseOrder["status"], string> = {
  active:  "bg-emerald-100 text-emerald-800",
  testing: "bg-blue-100 text-blue-800",
  pending: "bg-gray-100 text-gray-600",
  error:   "bg-red-100 text-red-700",
};

const SCORE_COLOR = (score: number) =>
  score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-600";

interface Props {
  po: PurchaseOrder;
  selected: boolean;
  onClick: () => void;
}

export default function POCard({ po, selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-4 transition-all ${
        selected
          ? "border-blue-500 bg-blue-50 shadow-sm"
          : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900 text-sm">{po.supplierName}</p>
          <p className="text-xs text-gray-500 mt-0.5">PO {po.poNumber} · {po.format}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[po.status]}`}>
          {po.status}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Readiness</p>
          <p className={`text-sm font-bold ${SCORE_COLOR(po.readinessScore)}`}>{po.readinessScore}%</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Total</p>
          <p className="text-sm font-semibold text-gray-800">
            {po.currency} {po.totalAmount.toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">ANID</p>
          <p className="text-xs font-mono text-gray-600 truncate max-w-[100px]">{po.supplierAnid}</p>
        </div>
      </div>

      {/* Readiness bar */}
      <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            po.readinessScore >= 80 ? "bg-emerald-500" : po.readinessScore >= 50 ? "bg-amber-400" : "bg-red-400"
          }`}
          style={{ width: `${po.readinessScore}%` }}
        />
      </div>
    </button>
  );
}
