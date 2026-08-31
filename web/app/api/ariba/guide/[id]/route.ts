import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (BACKEND) {
    try {
      const res = await fetch(`${BACKEND}/api/aie/download-excel/${id}`);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="AIE-Integration-Guide-${id}.xlsx"`,
          },
        });
      }
    } catch {
      // fall through
    }
  }

  // Mock: return guide metadata (can't generate Excel without Python backend)
  return NextResponse.json({
    success: true,
    guide: {
      poNumber: id,
      filename: `AIE-Integration-Guide-${id}.xlsx`,
      sheets: ["Overview", "multi-line-split", "no-supplier-part", "adhoc-shipto"],
      generatedAt: new Date().toISOString(),
      fieldCount: 42,
      message: "Run aie-backend locally for real Excel download",
    },
    source: "mock",
  });
}
