import Link from "next/link";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProjectsBrowser } from "@/components/dashboard/ProjectsBrowser";
import type { Project } from "@/types";

export default async function ProjectsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let projects: Project[] = [];

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      projects = (data as Project[] | null) ?? [];
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">My Projects</h1>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs font-semibold text-text-secondary">
              {projects.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Every app you have generated, in one place.
          </p>
        </div>
        <Link
          href="/generate"
          className="gradient-bg inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Sparkles className="h-4 w-4" />
          New App
        </Link>
      </div>

      <div className="mt-8">
        <ProjectsBrowser projects={projects} />
      </div>
    </div>
  );
}
