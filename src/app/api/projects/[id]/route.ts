import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/with-timeout";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Project id is required" },
        { status: 400 },
      );
    }

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
    const { data: deletedProject, error } = await withTimeout(
      admin
        .from("projects")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)
        .select("id")
        .maybeSingle<{ id: string }>(),
      10000,
      "Deleting project timed out.",
    );

    if (error) {
      throw error;
    }

    if (!deletedProject) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete project";
    console.error("[projects] delete project failed:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
