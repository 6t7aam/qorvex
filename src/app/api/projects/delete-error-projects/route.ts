import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/with-timeout";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await withTimeout(
      supabase.auth.getUser(),
      10000,
      "Authentication timed out.",
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const admin = createAdminClient();
    const { data: deletedProjects, error } = await withTimeout(
      admin
        .from("projects")
        .delete()
        .eq("user_id", user.id)
        .eq("status", "error")
        .select("id"),
      10000,
      "Deleting error projects timed out.",
    );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      deletedCount: deletedProjects?.length ?? 0,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete error projects";
    console.error("[projects] bulk delete error projects failed:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
