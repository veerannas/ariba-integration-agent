import { NextRequest, NextResponse } from "next/server";
import { MOCK_SCENARIOS } from "@/lib/ariba/mock";

const BACKEND = process.env.BACKEND_URL ?? "";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { poNumber, scenarios = ["multi-line-split", "no-supplier-part", "adhoc-shipto"] } = body;

  if (BACKEND) {
    try {
      const res = await fetch(`${BACKEND}/api/aie/generate-scenarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ basePO: poNumber, scenarios }),
      });
      const data = await res.json();
      return NextResponse.json(data);
    } catch {
      // fall through to mock
    }
  }

  // Mock: return pre-built scenarios filtered by requested list
  const result = MOCK_SCENARIOS.filter((s) => scenarios.includes(s.id));
  return NextResponse.json({
    success: true,
    scenarios: result,
    excelReady: true,
    excelPath: `/api/ariba/guide/${poNumber}`,
    source: "mock",
  });
}

export async function GET() {
  if (BACKEND) {
    try {
      const res = await fetch(`${BACKEND}/api/aie/scenarios`);
      const data = await res.json();
      return NextResponse.json(data);
    } catch {
      // fall through
    }
  }
  return NextResponse.json({ success: true, scenarios: MOCK_SCENARIOS, source: "mock" });
}
