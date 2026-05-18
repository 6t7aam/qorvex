import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProjectDetailTabs } from "@/components/dashboard/ProjectDetailTabs";
import { createPrivatePageMetadata } from "@/lib/seo";
import type { Plan, Project } from "@/types";

interface AppVersionRow {
  id: string;
  version_number: number;
  prompt: string;
  created_at: string;
}

const STATUS_BADGE: Record<Project["status"], string> = {
  generating: "bg-amber-500/15 text-amber-300 ring-amber-500/30 animate-pulse",
  ready: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  error: "bg-red-500/15 text-red-300 ring-red-500/30",
  deployed: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  return createPrivatePageMetadata({
    title: "Project Editor",
    description:
      "Edit, preview, export, and manage your AI-generated mobile app project in Qorvex.",
    path: `/projects/${id}`,
  });
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single<Project>();

  if (!project) notFound();

  const { data: versionsData } = await supabase
    .from("app_versions")
    .select("id, version_number, prompt, created_at")
    .eq("project_id", project.id)
    .order("version_number", { ascending: false });
  const versions = (versionsData as AppVersionRow[] | null) ?? [];

  const { data: profileRow } = await supabase
    .from("user_profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle<{ plan: Plan | null }>();
  const userPlan: Plan = (profileRow?.plan as Plan | null | undefined) ?? "free";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        All projects
      </Link>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{project.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-text-secondary">
            {project.description ?? project.prompt}
          </p>
        </div>
        <span
          className={`inline-flex items-center self-start rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ring-1 ${STATUS_BADGE[project.status]}`}
        >
          {project.status}
        </span>
      </div>

      <div className="mt-8">
        <ProjectDetailTabs
          project={project}
          versions={versions}
          initialTab={tab}
          userPlan={userPlan}
        />
      </div>
    </div>
  );
}
