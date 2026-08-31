import { NextRequest, NextResponse } from "next/server";
import { MOCK_VALIDATION, MOCK_VALIDATION_ERROR } from "@/lib/ariba/mock";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { cxml, poNumber } = body;

  // Simulate validation: suppliers with known ANID_MISMATCH return error result
  const errorAnids = ["AN02000000001-T"];
  const hasError = errorAnids.some(
    (anid) => (cxml && cxml.includes(anid)) || (poNumber === "7800459913")
  );

  await new Promise((r) => setTimeout(r, 400)); // realistic latency

  return NextResponse.json({
    success: true,
    result: hasError ? MOCK_VALIDATION_ERROR : MOCK_VALIDATION,
    source: "mock",
  });
}
