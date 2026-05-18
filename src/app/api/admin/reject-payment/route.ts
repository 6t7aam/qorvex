import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/with-timeout";
import { requireAdmin } from "@/lib/admin";
import type { ManualPayment } from "@/types";

export const dynamic = "force-dynamic";

interface RejectBody {
  paymentId?: string;
  adminNote?: string;
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    let body: RejectBody;
    try {
      body = (await request.json()) as RejectBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const paymentId = body.paymentId;
    if (!paymentId || typeof paymentId !== "string") {
      return NextResponse.json(
        { success: false, error: "paymentId is required" },
        { status: 400 },
      );
    }

    const adminNote =
      typeof body.adminNote === "string" ? body.adminNote.slice(0, 500) : null;

    const sb = createAdminClient();
    const { data: payment, error: fetchError } = await withTimeout(
      sb
        .from("manual_payments")
        .select("*")
        .eq("id", paymentId)
        .maybeSingle<ManualPayment>(),
      10000,
      "Fetching payment timed out.",
    );

    if (fetchError) {
      console.error("[admin/reject-payment] fetch failed:", fetchError);
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 },
      );
    }

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 },
      );
    }

    if (payment.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: `Payment is already ${payment.status}`,
        },
        { status: 409 },
      );
    }

    const nowIso = new Date().toISOString();

    const { error: updateError } = await withTimeout(
      sb
        .from("manual_payments")
        .update({
          status: "rejected",
          rejected_at: nowIso,
          admin_note: adminNote,
        })
        .eq("id", paymentId),
      10000,
      "Rejecting payment timed out.",
    );

    if (updateError) {
      console.error("[admin/reject-payment] update failed:", updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 },
      );
    }

    await sb
      .from("user_profiles")
      .update({ pending_plan: null })
      .eq("id", payment.user_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reject payment";
    console.error("[admin/reject-payment] threw:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
