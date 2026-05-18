import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import {
  createGitHubClient,
  ensureGitHubRepoAccess,
  getGitHubExportFiles,
  getStoredGitHubConnection,
  normalizeGitHubError,
  pushProjectFilesToGitHub,
  recordGitHubExport,
} from "@/lib/github/server";
import { getVisibleProjectFiles } from "@/lib/project-artifacts";
import type { Project } from "@/types";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface ExportBody {
  repoFullName?: string;
  branch?: string;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    let body: ExportBody;
    try {
      body = (await request.json()) as ExportBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    const repoFullName = body.repoFullName?.trim();
    const branchInput = body.branch?.trim();

    if (!id || !repoFullName) {
      return NextResponse.json(
        { success: false, error: "Project id and repoFullName are required." },
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

    const admin = createAdminClient();
    const { data: project, error: projectError } = await admin
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single<Project>();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: "Project not found." },
        { status: 404 },
      );
    }

    const generatedFiles = (project.generated_code ?? {}) as Record<string, string>;
    if (getVisibleProjectFiles(generatedFiles).length === 0) {
      return NextResponse.json(
        { success: false, error: "No generated files found for this project." },
        { status: 404 },
      );
    }

    const connection = await getStoredGitHubConnection(admin, user.id);
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
    const target = await ensureGitHubRepoAccess(
      octokit,
      connection,
      repoFullName,
    );

    if (branchInput && branchInput !== target.branch) {
      target.branch = branchInput;
    }

    const filesToExport = getGitHubExportFiles(project);
    if (Object.keys(filesToExport).length === 0) {
      return NextResponse.json(
        { success: false, error: "No generated files found for this project." },
        { status: 404 },
      );
    }

    const pushed = await pushProjectFilesToGitHub({
      octokit,
      project,
      target,
      commitMessage: "Export Qorvex generated app",
    });

    await admin
      .from("projects")
      .update({ github_repo: target.repoFullName })
      .eq("id", project.id);

    await admin.from("deployments").insert({
      project_id: project.id,
      user_id: user.id,
      platform: "github",
      status: "deployed",
      url: target.repoUrl,
      build_logs: `Branch: ${target.branch}\nCommit: ${pushed.commitSha}`,
      deployed_at: new Date().toISOString(),
    });

    await recordGitHubExport(admin, {
      projectId: project.id,
      userId: user.id,
      repoFullName: target.repoFullName,
      repoUrl: target.repoUrl,
      branch: target.branch,
      commitSha: pushed.commitSha,
    });

    return NextResponse.json({
      success: true,
      repoFullName: target.repoFullName,
      repoUrl: target.repoUrl,
      branch: target.branch,
      commitSha: pushed.commitSha,
      commitUrl: pushed.commitUrl,
    });
  } catch (error) {
    console.error("[projects/export/github] failed:", error);
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
