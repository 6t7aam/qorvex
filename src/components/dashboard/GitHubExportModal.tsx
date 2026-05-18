"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { withTimeout } from "@/lib/with-timeout";

interface GitHubConnectionStatus {
  connected: boolean;
  githubUsername: string | null;
  connectedAt: string | null;
}

interface GitHubRepoSummary {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
  html_url: string;
}

type RepoMode = "existing" | "new";
type Stage =
  | "idle"
  | "connecting"
  | "loadingRepos"
  | "creatingRepo"
  | "preparingFiles"
  | "pushingFiles"
  | "complete";

interface GitHubExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  redirectPath: string;
  connection: GitHubConnectionStatus | null;
  onConnectionRefresh: () => Promise<GitHubConnectionStatus | null>;
}

async function parseJson<T>(response: Response) {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function stageLabel(stage: Stage) {
  switch (stage) {
    case "connecting":
      return "Connecting GitHub";
    case "loadingRepos":
      return "Loading repositories";
    case "creatingRepo":
      return "Creating repository";
    case "preparingFiles":
      return "Preparing files";
    case "pushingFiles":
      return "Pushing files";
    case "complete":
      return "Export complete";
    default:
      return null;
  }
}

export function GitHubExportModal({
  open,
  onOpenChange,
  projectId,
  projectName,
  redirectPath,
  connection,
  onConnectionRefresh,
}: GitHubExportModalProps) {
  const defaultRepoName = useMemo(
    () => projectName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    [projectName],
  );
  const [mode, setMode] = useState<RepoMode>("existing");
  const [repos, setRepos] = useState<GitHubRepoSummary[]>([]);
  const [repoQuery, setRepoQuery] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [newRepoName, setNewRepoName] = useState(defaultRepoName);
  const [isPrivateRepo, setIsPrivateRepo] = useState(true);
  const [branchName, setBranchName] = useState("main");
  const [stage, setStage] = useState<Stage>("idle");
  const [stageError, setStageError] = useState<string | null>(null);
  const [repoUrl, setRepoUrl] = useState<string | null>(null);
  const [commitUrl, setCommitUrl] = useState<string | null>(null);
  const [reconnectRequired, setReconnectRequired] = useState(false);

  const isBusy = stage !== "idle" && stage !== "complete";
  const statusLabel = stageLabel(stage);
  const connectedUsername = connection?.githubUsername ?? null;

  const selectedRepoData = useMemo(
    () => repos.find((repo) => repo.full_name === selectedRepo) ?? null,
    [repos, selectedRepo],
  );

  const loadRepos = useCallback(async (query = "") => {
    if (!connectedUsername) return;
    setStage("loadingRepos");
    setStageError(null);
    try {
      const response = await withTimeout(
        fetch(`/api/github/repos?query=${encodeURIComponent(query)}`, {
          method: "GET",
          cache: "no-store",
        }),
        15_000,
        "Loading repositories timed out.",
      );

      const payload = (await parseJson<{
        success?: boolean;
        repos?: GitHubRepoSummary[];
        error?: string;
        reconnectRequired?: boolean;
      }>(response)) ?? { success: false, error: "Failed to load repositories." };

      if (!response.ok || !payload.success) {
        setReconnectRequired(!!payload.reconnectRequired);
        throw new Error(payload.error ?? "Failed to load repositories.");
      }

      setRepos(payload.repos ?? []);
      if (!selectedRepo && payload.repos?.[0]) {
        setSelectedRepo(payload.repos[0].full_name);
        setBranchName(payload.repos[0].default_branch || "main");
      }
      setStage("idle");
    } catch (error) {
      setStage("idle");
      setStageError(
        error instanceof Error ? error.message : "Failed to load repositories.",
      );
    }
  }, [connectedUsername, selectedRepo]);

  useEffect(() => {
    if (!open || !connectedUsername) {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadRepos(repoQuery);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [connectedUsername, loadRepos, open, repoQuery]);

  function resetModalState() {
    setMode("existing");
    setRepoQuery("");
    setSelectedRepo("");
    setNewRepoName(defaultRepoName);
    setIsPrivateRepo(true);
    setBranchName("main");
    setStage("idle");
    setStageError(null);
    setRepoUrl(null);
    setCommitUrl(null);
    setReconnectRequired(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetModalState();
    }
    onOpenChange(nextOpen);
  }

  function connectGitHub() {
    setStage("connecting");
    const url = `/api/github/connect?redirectTo=${encodeURIComponent(redirectPath)}`;
    window.location.href = url;
  }

  async function createRepository() {
    setStage("creatingRepo");
    const response = await withTimeout(
      fetch("/api/github/repos/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRepoName.trim(),
          private: isPrivateRepo,
          branch: branchName.trim() || "main",
        }),
      }),
      20_000,
      "Creating repository timed out.",
    );

    const payload = (await parseJson<{
      success?: boolean;
      repo?: GitHubRepoSummary;
      error?: string;
      reconnectRequired?: boolean;
    }>(response)) ?? { success: false, error: "Failed to create repository." };

    if (!response.ok || !payload.success || !payload.repo) {
      setReconnectRequired(!!payload.reconnectRequired);
      throw new Error(payload.error ?? "Failed to create repository.");
    }

    return payload.repo;
  }

  async function exportProject(repoFullName: string, branch: string) {
    setStage("preparingFiles");
    const responsePromise = fetch(`/api/projects/${projectId}/export/github`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repoFullName,
        branch,
      }),
    });
    setStage("pushingFiles");

    const response = await withTimeout(
      responsePromise,
      45_000,
      "GitHub export timed out.",
    );

    const payload = (await parseJson<{
      success?: boolean;
      repoUrl?: string;
      commitUrl?: string;
      commitSha?: string;
      repoFullName?: string;
      error?: string;
      reconnectRequired?: boolean;
    }>(response)) ?? { success: false, error: "Failed to export project." };

    if (!response.ok || !payload.success) {
      setReconnectRequired(!!payload.reconnectRequired);
      throw new Error(payload.error ?? "Failed to export project.");
    }

    return payload;
  }

  async function handleSubmit() {
    if (isBusy) return;

    if (!connectedUsername) {
      connectGitHub();
      return;
    }

    if (mode === "existing" && !selectedRepo) {
      toast.error("Select a GitHub repository first.");
      return;
    }

    if (mode === "new" && newRepoName.trim().length < 2) {
      toast.error("Repository name must be at least 2 characters.");
      return;
    }

    setStageError(null);
    setRepoUrl(null);
    setCommitUrl(null);
    setReconnectRequired(false);

    try {
      let repo = selectedRepoData;

      if (mode === "new") {
        repo = await createRepository();
      }

      const targetBranch =
        (mode === "new" ? branchName : branchName || repo?.default_branch) || "main";
      const exportResult = await exportProject(
        repo?.full_name ?? selectedRepo,
        targetBranch.trim() || "main",
      );

      setRepoUrl(exportResult.repoUrl ?? repo?.html_url ?? null);
      setCommitUrl(exportResult.commitUrl ?? null);
      setStage("complete");
      toast.success("GitHub export complete.");
      await onConnectionRefresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to export project.";
      setStage("idle");
      setStageError(message);
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showClose={!isBusy}>
        <DialogHeader>
          <DialogTitle>GitHub Export</DialogTitle>
          <DialogDescription>
            Connect GitHub, choose a repository, and export the generated Expo
            project files for {projectName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-wider text-text-muted">
              Connection
            </div>
            <div className="mt-2 text-sm text-white">
              {connectedUsername ? (
                <>Connected as <span className="font-semibold">@{connectedUsername}</span></>
              ) : (
                "GitHub is not connected yet."
              )}
            </div>
            {!connectedUsername && (
              <button
                type="button"
                onClick={connectGitHub}
                disabled={isBusy}
                className="mt-3 inline-flex items-center justify-center rounded-xl bg-white/[0.06] px-3 py-2 text-sm font-medium text-white transition hover:bg-white/[0.1] disabled:opacity-50"
              >
                {stage === "connecting" ? "Connecting GitHub..." : "Connect GitHub"}
              </button>
            )}
          </div>

          {connectedUsername && (
            <>
              <div className="flex gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                <button
                  type="button"
                  onClick={() => setMode("existing")}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm transition ${
                    mode === "existing"
                      ? "bg-violet-500/20 text-white"
                      : "text-text-secondary hover:text-white"
                  }`}
                >
                  Select existing repository
                </button>
                <button
                  type="button"
                  onClick={() => setMode("new")}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm transition ${
                    mode === "new"
                      ? "bg-violet-500/20 text-white"
                      : "text-text-secondary hover:text-white"
                  }`}
                >
                  Create new repository
                </button>
              </div>

              {mode === "existing" ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-text-muted">
                      Search repositories
                    </label>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={repoQuery}
                        onChange={(event) => setRepoQuery(event.target.value)}
                        placeholder="Search by name"
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-violet-400/50"
                      />
                      <button
                        type="button"
                        onClick={() => void loadRepos(repoQuery)}
                        disabled={isBusy}
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white transition hover:bg-white/[0.08] disabled:opacity-50"
                      >
                        <RefreshCcw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-2">
                    {repos.length === 0 ? (
                      <div className="px-3 py-6 text-center text-sm text-text-secondary">
                        No repositories found for this account.
                      </div>
                    ) : (
                      repos.map((repo) => (
                        <button
                          key={repo.id}
                          type="button"
                          onClick={() => {
                            setSelectedRepo(repo.full_name);
                            setBranchName(repo.default_branch || "main");
                          }}
                          className={`block w-full rounded-xl border px-3 py-2 text-left transition ${
                            selectedRepo === repo.full_name
                              ? "border-violet-400/40 bg-violet-500/10"
                              : "border-white/5 bg-white/[0.02] hover:border-white/10"
                          }`}
                        >
                          <div className="text-sm font-medium text-white">
                            {repo.full_name}
                          </div>
                          <div className="mt-1 text-xs text-text-secondary">
                            {repo.private ? "Private" : "Public"} · default branch {repo.default_branch}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-text-muted">
                      Repository name
                    </label>
                    <input
                      value={newRepoName}
                      onChange={(event) => setNewRepoName(event.target.value)}
                      placeholder="my-qorvex-app"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-violet-400/50"
                    />
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-wider text-text-muted">
                      Visibility
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPrivateRepo(true)}
                        className={`rounded-xl px-3 py-2 text-sm transition ${
                          isPrivateRepo
                            ? "bg-violet-500/20 text-white"
                            : "bg-white/[0.03] text-text-secondary hover:text-white"
                        }`}
                      >
                        Private
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPrivateRepo(false)}
                        className={`rounded-xl px-3 py-2 text-sm transition ${
                          !isPrivateRepo
                            ? "bg-violet-500/20 text-white"
                            : "bg-white/[0.03] text-text-secondary hover:text-white"
                        }`}
                      >
                        Public
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs uppercase tracking-wider text-text-muted">
                  Branch name
                </label>
                <input
                  value={branchName}
                  onChange={(event) => setBranchName(event.target.value)}
                  placeholder="main"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-violet-400/50"
                />
              </div>
            </>
          )}

          {(statusLabel || stageError || reconnectRequired || repoUrl) && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              {statusLabel && (
                <div className="flex items-center gap-2 text-sm text-white">
                  {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{statusLabel}</span>
                </div>
              )}
              {stageError && (
                <div className="mt-2 text-sm text-red-300">{stageError}</div>
              )}
              {reconnectRequired && (
                <button
                  type="button"
                  onClick={connectGitHub}
                  className="mt-3 rounded-xl bg-white/[0.06] px-3 py-2 text-sm font-medium text-white transition hover:bg-white/[0.1]"
                >
                  Reconnect GitHub
                </button>
              )}
              {repoUrl && (
                <div className="mt-3 space-y-2">
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-sm font-medium text-violet-300 transition hover:text-violet-200"
                  >
                    Open repository
                  </a>
                  {commitUrl && (
                    <a
                      href={commitUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-xs text-text-secondary transition hover:text-white"
                    >
                      View latest commit
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
            className="rounded-xl bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:opacity-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={
              isBusy ||
              !connectedUsername ||
              (mode === "existing" && !selectedRepo) ||
              (mode === "new" && newRepoName.trim().length < 2)
            }
            className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-50"
          >
            {isBusy ? "Working..." : mode === "new" ? "Create and export" : "Export project"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
