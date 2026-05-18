"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { withTimeout } from "@/lib/with-timeout";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Project } from "@/types";

const FILTERS: { value: "all" | Project["status"]; label: string }[] = [
  { value: "all", label: "All" },
  { value: "generating", label: "Generating" },
  { value: "ready", label: "Ready" },
  { value: "deployed", label: "Deployed" },
];

const PAGE_SIZE = 12;

interface ProjectsBrowserProps {
  projects: Project[];
}

export function ProjectsBrowser({ projects }: ProjectsBrowserProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | Project["status"]>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [localProjects, setLocalProjects] = useState(projects);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const errorProjects = localProjects.filter((p) => p.status === "error");

  function handleProjectDelete(id: string) {
    setLocalProjects((prev) => prev.filter((p) => p.id !== id));
    router.refresh();
  }

  async function handleDeleteAllErrors() {
    setIsDeletingAll(true);
    try {
      if (errorProjects.length === 0) {
        toast.error("No error projects to delete");
        setShowDeleteAllDialog(false);
        return;
      }

      const response = await withTimeout(
        fetch("/api/projects/delete-error-projects", {
          method: "POST",
          cache: "no-store",
        }),
        10000,
        "Delete all error projects timed out. Please check your connection and try again.",
      );
      const body = (await response.json().catch(() => null)) as
        | { success?: boolean; deletedCount?: number; error?: string }
        | null;

      if (!response.ok || !body?.success) {
        throw new Error(body?.error ?? "Failed to delete projects");
      }

      const deletedCount = body.deletedCount ?? 0;
      toast.success(`Deleted ${deletedCount} error project${deletedCount === 1 ? "" : "s"}`);
      setLocalProjects((prev) => prev.filter((p) => p.status !== "error"));
      setShowDeleteAllDialog(false);
      router.refresh();
    } catch (error) {
      console.error("Delete all errors failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete projects");
    } finally {
      setIsDeletingAll(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return localProjects.filter((p) => {
      if (filter !== "all" && p.status !== filter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        p.prompt.toLowerCase().includes(q)
      );
    });
  }, [localProjects, filter, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setFilter(f.value);
                setPage(0);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filter === f.value
                  ? "bg-violet-500/20 text-white"
                  : "text-text-secondary hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {errorProjects.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDeleteAllDialog(true)}
              className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete all error projects ({errorProjects.length})
            </button>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
              placeholder="Search projects"
              className="w-full rounded-xl border border-white/10 bg-white/[0.02] py-2 pl-9 pr-3 text-sm text-white placeholder:text-text-muted focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 sm:w-72"
            />
          </div>
        </div>
      </div>

      {pageItems.length === 0 ? (
        <EmptyProjects total={localProjects.length} filtered={filtered.length} />
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleProjectDelete}
              />
            ))}
          </div>

          {pageCount > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="glass-border rounded-lg bg-white/[0.02] px-3 py-1.5 text-white transition hover:bg-white/[0.06] disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-text-secondary">
                Page {safePage + 1} of {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={safePage >= pageCount - 1}
                className="glass-border rounded-lg bg-white/[0.02] px-3 py-1.5 text-white transition hover:bg-white/[0.06] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <Dialog
        open={showDeleteAllDialog}
        onOpenChange={(open) => {
          if (isDeletingAll) return;
          setShowDeleteAllDialog(open);
        }}
      >
        <DialogContent showClose={!isDeletingAll}>
          <DialogHeader>
            <DialogTitle>Delete all error projects</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all {errorProjects.length} error
              project{errorProjects.length === 1 ? "" : "s"}? This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setShowDeleteAllDialog(false)}
              disabled={isDeletingAll}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.06] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteAllErrors}
              disabled={isDeletingAll}
              className="flex-1 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
            >
              {isDeletingAll ? "Deleting..." : "Delete All"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyProjects({
  total,
  filtered,
}: {
  total: number;
  filtered: number;
}) {
  const noProjectsAtAll = total === 0;
  return (
    <div className="glass-border mt-6 flex flex-col items-center rounded-2xl bg-background-secondary/40 px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-cyan-500/30 ring-1 ring-white/10">
        <Sparkles className="h-6 w-6 text-violet-200" />
      </div>
      <h3 className="mt-5 text-base font-semibold text-white">
        {noProjectsAtAll ? "No projects yet" : "No matching projects"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-text-secondary">
        {noProjectsAtAll
          ? "Generate your first app to see it here."
          : `Filtered out ${total - filtered} project${total - filtered === 1 ? "" : "s"}.`}
      </p>
      <Link
        href="/generate"
        className="gradient-bg mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Generate an app
      </Link>
    </div>
  );
}
