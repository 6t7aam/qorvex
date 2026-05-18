import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const storagePath = searchParams.get("path");
    if (!storagePath) {
      return NextResponse.json(
        { success: false, error: "path is required" },
        { status: 400 },
      );
    }

    const sb = createAdminClient();
    const { data, error } = await sb.storage
      .from("payment-screenshots")
      .createSignedUrl(storagePath, 60);

    if (error || !data?.signedUrl) {
      console.error("[admin/screenshot] signed url failed:", error);
      return NextResponse.json(
        {
          success: false,
          error: error?.message ?? "Could not generate signed URL",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, signedUrl: data.signedUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch screenshot";
    console.error("[admin/screenshot] threw:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
