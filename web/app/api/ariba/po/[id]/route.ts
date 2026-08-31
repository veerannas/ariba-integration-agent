import { NextRequest, NextResponse } from "next/server";
import { MOCK_POS } from "@/lib/ariba/mock";

const BACKEND = process.env.BACKEND_URL ?? "";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (BACKEND) {
    try {
      const res = await fetch(`${BACKEND}/api/aie/po/${id}/cxml`);
      const data = await res.json();
      return NextResponse.json(data);
    } catch {
      // fall through to mock
    }
  }

  const po = MOCK_POS.find((p) => p.poNumber === id);
  if (!po) return NextResponse.json({ success: false, error: `PO ${id} not found` }, { status: 404 });
  return NextResponse.json({ success: true, po, source: "mock" });
}
