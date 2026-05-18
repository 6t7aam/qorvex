import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getDownloadableProjectFiles,
  getProjectDownloadName,
  getVisibleProjectFiles,
} from "@/lib/project-artifacts";
import type { Project } from "@/types";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: "Project id is required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single<Project>();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const files = (project.generated_code ?? {}) as Record<string, string>;
  if (getVisibleProjectFiles(files).length === 0) {
    return NextResponse.json(
      { error: "No generated files found for this project." },
      { status: 404 },
    );
  }

  const payload = JSON.stringify(
    {
      projectId: project.id,
      projectName: project.name,
      exportedAt: new Date().toISOString(),
      files: getDownloadableProjectFiles(files),
    },
    null,
    2,
  );

  return new Response(payload, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${getProjectDownloadName(project.name)}"`,
      "Cache-Control": "no-store",
    },
  });
}
