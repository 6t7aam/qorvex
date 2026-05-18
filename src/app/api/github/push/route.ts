import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        "This endpoint is deprecated. Use /api/projects/[id]/export/github instead.",
    },
    { status: 410 },
  );
}
