import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import {
  createGitHubClient,
  getStoredGitHubConnection,
  normalizeGitHubError,
} from "@/lib/github/server";

export const dynamic = "force-dynamic";

interface CreateRepoBody {
  name?: string;
  private?: boolean;
  branch?: string;
}

export async function POST(request: Request) {
  try {
    let body: CreateRepoBody;
    try {
      body = (await request.json()) as CreateRepoBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const repoName = body.name?.trim();
    const branch = body.branch?.trim() || "main";

    if (!repoName || repoName.length < 2) {
      return NextResponse.json(
        { success: false, error: "Repository name must be at least 2 characters." },
        { status: 400 },
      );
    }

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

    const octokit = createGitHubClient(connection.access_token);
    const { data: repo } = await octokit.rest.repos.createForAuthenticatedUser({
      name: repoName,
      private: body.private ?? true,
      auto_init: true,
      description: "Exported from Qorvex",
    });

    if (branch !== repo.default_branch) {
      const { data: defaultRef } = await octokit.rest.git.getRef({
        owner: repo.owner.login,
        repo: repo.name,
        ref: `heads/${repo.default_branch}`,
      });

      await octokit.rest.git.createRef({
        owner: repo.owner.login,
        repo: repo.name,
        ref: `refs/heads/${branch}`,
        sha: defaultRef.object.sha,
      });

      await octokit.rest.repos.update({
        owner: repo.owner.login,
        repo: repo.name,
        default_branch: branch,
      });
    }

    return NextResponse.json({
      success: true,
      repo: {
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        default_branch: branch,
        html_url: repo.html_url,
      },
    });
  } catch (error) {
    console.error("[github/repos/create] failed:", error);
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
