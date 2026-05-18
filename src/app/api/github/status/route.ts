import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import {
  getStoredGitHubConnection,
  toGitHubConnectionStatus,
} from "@/lib/github/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const connection = await getStoredGitHubConnection(
      createAdminClient(),
      user.id,
    );

    return NextResponse.json({
      success: true,
      connection: toGitHubConnectionStatus(connection ?? null),
    });
  } catch (error) {
    console.error("[github/status] failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to load GitHub status.",
      },
      { status: 500 },
    );
  }
}
