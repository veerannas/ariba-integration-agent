import { NextResponse } from "next/server";
import { MOCK_POS } from "@/lib/ariba/mock";

const BACKEND = process.env.BACKEND_URL ?? "";

export async function GET() {
  if (BACKEND) {
    try {
      const res = await fetch(`${BACKEND}/api/aie/pos`);
      const data = await res.json();
      return NextResponse.json(data);
    } catch {
      // fall through to mock
    }
  }
  return NextResponse.json({ success: true, pos: MOCK_POS, source: "mock" });
}
