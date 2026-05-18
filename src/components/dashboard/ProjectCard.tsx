"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Copy,
  MoreHorizontal,
  Pencil,
  ExternalLink,
  Trash2,
  Code2,
} from "lucide-react";
import { toast } from "sonner";
import { withTimeout } from "@/lib/with-timeout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Project } from "@/types";

const STATUS_STYLES: Record<
  Project["status"],
  { label: string; className: string }
> = {
  generating: {
    label: "Generating",
    className:
      "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30 animate-pulse",
  },
  ready: {
    label: "Ready",
    className: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
  },
  error: {
    label: "Error",
    className: "bg-red-500/15 text-red-300 ring-1 ring-red-500/30",
  },
  deployed: {
    label: "Deployed",
    className: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30",
  },
};

function formatDate(iso: string) {
  try {
    const date = new Date(iso);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function ProjectCard({
  project,
  onDelete,
}: {
  project: Project;
  onDelete?: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const status = STATUS_STYLES[project.status];

  const primary = project.colors?.primary ?? "#7c3aed";
  const secondary = project.colors?.secondary ?? "#06b6d4";
  const hasGeneratedCode =
    project.status === "ready" &&
    project.generated_code &&
    Object.keys(project.generated_code).length > 0;

  function openDeleteDialog() {
    setMenuOpen(false);
    // Defer opening the dialog until after the dropdown has unmounted its
    // focus trap so the dialog can install its own without conflict.
    setTimeout(() => setShowDeleteDialog(true), 0);
  }

  async function handleDelete() {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const response = await withTimeout(
        fetch(`/api/projects/${project.id}`, {
          method: "DELETE",
          cache: "no-store",
        }),
        10000,
        "Delete project timed out. Please check your connection and try again.",
      );
      const body = (await response.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null;

      if (!response.ok || !body?.success) {
        throw new Error(body?.error ?? "Failed to delete project");
      }

      setShowDeleteDialog(false);
      toast.success("Project deleted");
      if (onDelete) {
        onDelete(project.id);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete project",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="glass-border group relative flex h-full flex-col overflow-hidden rounded-2xl bg-background-secondary/40 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/40">
      <Link href={`/projects/${project.id}`} className="block">
        <div
          className="relative flex h-32 items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
          }}
        >
          <div className="h-20 w-12 rounded-md border border-white/20 bg-black/40 shadow-inner shadow-black/40">
            <div className="mx-auto mt-1 h-0.5 w-3 rounded-full bg-white/40" />
            <div className="mt-2 space-y-1 px-1">
              <div className="h-1 w-full rounded-full bg-white/30" />
              <div className="h-1 w-2/3 rounded-full bg-white/20" />
              <div className="mt-1.5 h-5 rounded-sm bg-white/10" />
              <div className="grid grid-cols-2 gap-0.5">
                <div className="h-3 rounded-sm bg-white/10" />
                <div className="h-3 rounded-sm bg-white/10" />
              </div>
            </div>
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/projects/${project.id}`}>
          <h3 className="truncate text-base font-semibold text-white transition group-hover:text-violet-200">
            {project.name}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-text-secondary">
          {project.description ?? project.prompt}
        </p>
        <div className="mt-3 text-xs text-text-muted">
          {formatDate(project.created_at)}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider ${status.className}`}
          >
            {status.label.toUpperCase()}
          </span>

          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                }}
                className="rounded-md p-1.5 text-text-muted transition hover:bg-white/[0.04] hover:text-white"
                aria-label={`Open actions for ${project.name}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(event) => event.stopPropagation()}
            >
              <DropdownMenuItem asChild>
                <Link href={`/projects/${project.id}`}>
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open
                </Link>
              </DropdownMenuItem>
              {hasGeneratedCode && (
                <DropdownMenuItem asChild>
                  <Link href={`/projects/${project.id}?tab=editor`}>
                    <Code2 className="h-3.5 w-3.5" />
                    Open in Editor
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <Pencil className="h-3.5 w-3.5" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Copy className="h-3.5 w-3.5" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  openDeleteDialog();
                }}
                className="text-red-300 focus:bg-red-500/10 focus:text-red-200"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (isDeleting) return;
          setShowDeleteDialog(open);
        }}
      >
        <DialogContent showClose={!isDeleting}>
          <DialogHeader>
            <DialogTitle>Delete project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-white">{project.name}</span>?
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.06] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
