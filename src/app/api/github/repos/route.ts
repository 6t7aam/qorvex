import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import {
  createGitHubClient,
  getStoredGitHubConnection,
  listOwnedGitHubRepos,
  normalizeGitHubError,
} from "@/lib/github/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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

    if (!connection) {
      return NextResponse.json(
        {
          success: false,
          error: "GitHub is not connected.",
          reconnectRequired: true,
        },
        { status: 404 },
      );
    }

    const url = new URL(request.url);
    const query = url.searchParams.get("query") ?? "";
    const repos = await listOwnedGitHubRepos(
      createGitHubClient(connection.access_token),
      query,
    );

    return NextResponse.json({
      success: true,
      repos,
    });
  } catch (error) {
    console.error("[github/repos] failed:", error);
    const normalized = normalizeGitHubError(error);
    return NextResponse.json(
      {
        success: false,
        error: normalized.message,
        reconnectRequired: normalized.reconnectRequired,
      },
      { status: normalized.status },
    );
  }
}
