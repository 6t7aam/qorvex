"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Copy, Download, Lock, Rocket, Upload } from "lucide-react";
import { toast } from "sonner";
import { GitHubExportModal } from "@/components/dashboard/GitHubExportModal";
import { MobilePreview } from "@/components/generator/MobilePreview";
import { AIChat } from "@/components/generator/AIChat";
import {
  getProjectDownloadName,
  getVisibleProjectFiles,
} from "@/lib/project-artifacts";
import { withTimeout } from "@/lib/with-timeout";
import { isPaidPlan } from "@/lib/plans";
import type { Plan, Project } from "@/types";

const TABS = [
  { key: "editor", label: "Editor" },
  { key: "preview", label: "Preview" },
  { key: "code", label: "Code" },
  { key: "versions", label: "Versions" },
  { key: "deploy", label: "Deploy" },
] as const;

const CHECKLIST_ITEMS = [
  "Apple Developer account",
  "App name",
  "Bundle identifier",
  "App icon",
  "Splash screen",
  "Privacy policy URL",
  "Screenshots",
  "App description",
  "EAS build setup",
  "TestFlight",
  "App Store Review submission",
];

type TabKey = (typeof TABS)[number]["key"];
type DeployModalKey = "github" | "checklist" | null;

interface AppVersion {
  id: string;
  version_number: number;
  prompt: string;
  created_at: string;
}

interface GitHubConnectionStatus {
  connected: boolean;
  githubUsername: string | null;
  connectedAt: string | null;
}

interface ProjectDetailTabsProps {
  project: Project;
  versions: AppVersion[];
  initialTab?: string;
  userPlan?: Plan;
}

export function ProjectDetailTabs({
  project,
  versions,
  initialTab,
  userPlan = "free",
}: ProjectDetailTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasGeneratedCode =
    project.status === "ready" &&
    project.generated_code &&
    getVisibleProjectFiles(project.generated_code).length > 0;

  const getInitialTab = (): TabKey => {
    if (initialTab && TABS.some((item) => item.key === initialTab)) {
      return initialTab as TabKey;
    }
    return hasGeneratedCode ? "editor" : "preview";
  };

  const [tab, setTab] = useState<TabKey>(getInitialTab());
  const [files, setFiles] = useState<Record<string, string>>(
    (project.generated_code ?? {}) as Record<string, string>,
  );
  const [activeModal, setActiveModal] = useState<DeployModalKey>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [githubConnection, setGithubConnection] =
    useState<GitHubConnectionStatus | null>(null);
  const [isCheckingGitHub, setIsCheckingGitHub] = useState(false);
  const visibleFileList = useMemo(() => getVisibleProjectFiles(files), [files]);
  const [selectedFile, setSelectedFile] = useState<string | null>(
    visibleFileList[0] ?? null,
  );
  const activeSelectedFile =
    selectedFile && visibleFileList.includes(selectedFile)
      ? selectedFile
      : (visibleFileList[0] ?? null);

  function copyFile() {
    if (!activeSelectedFile) return;
    void navigator.clipboard?.writeText(files[activeSelectedFile] ?? "");
    toast.success("Copied file contents");
  }

  async function fetchGitHubConnectionStatus(silent = false) {
    if (!silent) {
      setIsCheckingGitHub(true);
    }

    try {
      const response = await withTimeout(
        fetch("/api/github/status", {
          method: "GET",
          cache: "no-store",
        }),
        10000,
        "GitHub status request timed out.",
      );

      const payload = (await response.json().catch(() => null)) as
        | {
            success?: boolean;
            connection?: GitHubConnectionStatus;
            error?: string;
          }
        | null;

      if (response.status === 401) {
        setGithubConnection(null);
        return null;
      }

      if (!response.ok || !payload?.success || !payload.connection) {
        throw new Error(payload?.error ?? "Failed to load GitHub connection.");
      }

      setGithubConnection(payload.connection);
      return payload.connection;
    } catch (error) {
      if (!silent) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load GitHub connection.",
        );
      }
      return null;
    } finally {
      if (!silent) {
        setIsCheckingGitHub(false);
      }
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchGitHubConnectionStatus(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const githubStatus = searchParams.get("github");
    if (!githubStatus) {
      return;
    }

    const timer = window.setTimeout(() => {
      const githubMessage = searchParams.get("githubMessage");
      if (githubStatus === "connected") {
        toast.success("GitHub connected successfully.");
        void fetchGitHubConnectionStatus(true).then(() => {
          setActiveModal("github");
        });
      } else if (githubStatus === "error") {
        toast.error(githubMessage ?? "GitHub connection failed.");
      }

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("github");
      nextParams.delete("githubMessage");
      const nextQuery = nextParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [pathname, router, searchParams]);

  const canExportToGitHub = isPaidPlan(userPlan);

  async function handleGitHubClick() {
    // Pro/Max gate. Free users get redirected to billing with a contextual upgrade banner.
    if (!canExportToGitHub) {
      router.push("/billing?upgrade=github_export");
      return;
    }

    let connection = githubConnection;
    if (!connection && !isCheckingGitHub) {
      setIsCheckingGitHub(true);
      try {
        connection = await fetchGitHubConnectionStatus(true);
      } finally {
        setIsCheckingGitHub(false);
      }
    }

    if (connection?.connected) {
      setActiveModal("github");
      return;
    }

    window.location.href = `/api/github/connect?redirectTo=${encodeURIComponent(
      `${pathname}?tab=deploy`,
    )}`;
  }

  async function downloadProjectFiles() {
    if (visibleFileList.length === 0) {
      toast.error("No generated files found for this project.");
      return;
    }

    setIsDownloading(true);
    try {
      const response = await withTimeout(
        fetch(`/api/projects/${project.id}/download`, {
          method: "GET",
          cache: "no-store",
        }),
        10000,
        "Download request timed out.",
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Failed to download files");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const disposition = response.headers.get("content-disposition");
      const fileNameMatch = disposition?.match(/filename="([^"]+)"/i);

      anchor.href = url;
      anchor.download =
        fileNameMatch?.[1] ?? getProjectDownloadName(project.name);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      toast.success("Project files downloaded");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to download files",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
        {TABS.map((item) => {
          if (item.key === "editor" && !hasGeneratedCode) return null;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                tab === item.key
                  ? "bg-violet-500/20 text-white"
                  : "text-text-secondary hover:text-white"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {tab === "editor" && hasGeneratedCode && (
          <div className="glass-border overflow-hidden rounded-2xl bg-background-secondary/40">
            <div className="grid h-[calc(100vh-20rem)] min-h-0 grid-cols-1 lg:grid-cols-2">
              <div className="min-h-0 overflow-hidden border-r border-white/5">
                <AIChat
                  key={`${project.id}-${files[".qorvex/chat-history.json"]?.length ?? 0}`}
                  projectId={project.id}
                  currentFiles={files}
                  projectName={project.name}
                  projectPrompt={project.prompt}
                  onFilesUpdate={(updatedFiles) => {
                    setFiles(updatedFiles);
                    router.refresh();
                  }}
                />
              </div>
              <div className="flex min-h-0 items-center justify-center overflow-hidden p-8">
                <MobilePreview
                  generatedFiles={files}
                  projectName={project.name}
                  projectPrompt={project.prompt}
                  colors={{
                    primary: project.colors?.primary ?? "#7c3aed",
                    secondary: project.colors?.secondary ?? "#06b6d4",
                    accent: project.colors?.accent ?? "#f59e0b",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {tab === "preview" && (
          <div className="flex justify-center">
            <MobilePreview
              generatedFiles={files}
              projectName={project.name}
              projectPrompt={project.prompt}
              colors={{
                primary: project.colors?.primary ?? "#7c3aed",
                secondary: project.colors?.secondary ?? "#06b6d4",
                accent: project.colors?.accent ?? "#f59e0b",
              }}
            />
          </div>
        )}

        {tab === "code" && (
          <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
            <aside className="glass-border max-h-[60vh] overflow-y-auto rounded-2xl bg-background-secondary/40 p-2 text-sm">
              {visibleFileList.length === 0 ? (
                <div className="px-3 py-4 text-sm text-text-muted">
                  No generated files yet. Once a project has code, you will see
                  the real file tree here.
                </div>
              ) : (
                visibleFileList.map((path) => (
                  <button
                    key={path}
                    type="button"
                    onClick={() => setSelectedFile(path)}
                    className={`block w-full truncate rounded-lg px-3 py-1.5 text-left font-mono text-xs transition ${
                      path === activeSelectedFile
                        ? "bg-violet-500/15 text-white"
                        : "text-text-secondary hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    {path}
                  </button>
                ))
              )}
            </aside>
            <div className="glass-border flex max-h-[60vh] flex-col overflow-hidden rounded-2xl bg-black/40">
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-2 text-xs text-text-secondary">
                <span className="truncate font-mono">
                  {selectedFile ?? "no file selected"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyFile}
                    disabled={!activeSelectedFile}
                    className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-1 text-[11px] text-white transition hover:bg-white/[0.08] disabled:opacity-40"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={downloadProjectFiles}
                    disabled={visibleFileList.length === 0 || isDownloading}
                    className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-1 text-[11px] text-white transition hover:bg-white/[0.08] disabled:opacity-40"
                  >
                    <Download className="h-3 w-3" />
                    {isDownloading ? "Downloading..." : "Download all"}
                  </button>
                </div>
              </div>
              <pre className="flex-1 overflow-auto px-4 py-3 font-mono text-xs leading-relaxed text-emerald-200/90">
                {activeSelectedFile && files[activeSelectedFile]
                  ? files[activeSelectedFile]
                  : "// select a file from the project tree"}
              </pre>
            </div>
          </div>
        )}

        {tab === "versions" && (
          <div className="space-y-3">
            {versions.length === 0 ? (
              <div className="glass-border rounded-2xl bg-background-secondary/40 p-8 text-center text-sm text-text-secondary">
                No saved versions yet. New generations and AI edits will appear
                here as version history.
              </div>
            ) : (
              versions.map((version, index) => (
                <div
                  key={version.id}
                  className="glass-border flex items-center justify-between gap-4 rounded-xl bg-background-secondary/40 px-4 py-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold text-white">
                        Version {version.version_number}
                      </div>
                      <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-muted">
                        {index === versions.length - 1 ? "Initial" : "Edit"}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-text-secondary">
                      {version.prompt}
                    </p>
                  </div>
                  <div className="text-right text-xs text-text-muted">
                    <div>{new Date(version.created_at).toLocaleDateString()}</div>
                    <div className="mt-1">Saved snapshot</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "deploy" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DeployCard
              icon={canExportToGitHub ? Upload : Lock}
              title="Export to GitHub"
              description={
                !canExportToGitHub
                  ? "Available on Pro and Max. Upgrade your plan to push generated Expo files straight to a GitHub repository."
                  : githubConnection?.connected
                    ? `Connected as @${githubConnection.githubUsername}. Create a repo or export to an existing one.`
                    : "Connect your GitHub account, create or pick a repository, and push the generated Expo project files."
              }
              cta={
                !canExportToGitHub
                  ? "Upgrade to unlock"
                  : isCheckingGitHub
                    ? "Checking..."
                    : githubConnection?.connected
                      ? "Export to GitHub"
                      : "Connect GitHub"
              }
              onClick={() => {
                void handleGitHubClick();
              }}
              disabled={canExportToGitHub && isCheckingGitHub}
              badge={!canExportToGitHub ? "Pro+ only" : undefined}
            />
            <DeployCard
              icon={Download}
              title="Download Expo Project"
              description="Download the generated project files as a portable export."
              cta={isDownloading ? "Downloading..." : "Download files"}
              onClick={downloadProjectFiles}
              disabled={isDownloading}
            />
            <DeployCard
              icon={Rocket}
              title="App Store Preparation"
              description="Review the release checklist for packaging, assets, privacy, builds, and TestFlight."
              cta="Open checklist"
              onClick={() => setActiveModal("checklist")}
            />
          </div>
        )}
      </div>

      <GitHubExportModal
        open={activeModal === "github"}
        onOpenChange={(open) => setActiveModal(open ? "github" : null)}
        projectId={project.id}
        projectName={project.name}
        redirectPath={`${pathname}?tab=deploy`}
        connection={githubConnection}
        onConnectionRefresh={async () => {
          const refreshed = await fetchGitHubConnectionStatus(true);
          router.refresh();
          return refreshed;
        }}
      />

      {activeModal === "checklist" && (
        <InfoModal
          title="App Store preparation checklist"
          onClose={() => setActiveModal(null)}
        >
          <p className="text-sm leading-relaxed text-text-secondary">
            Qorvex will automate more of this later. For now, use this checklist
            to prepare the app for release:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-text-secondary">
            {CHECKLIST_ITEMS.map((item) => (
              <li key={item} className="rounded-xl bg-white/[0.03] px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </InfoModal>
      )}
    </div>
  );
}

function DeployCard({
  icon: Icon,
  title,
  description,
  cta,
  onClick,
  disabled,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  cta: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <div className="glass-border flex h-full flex-col rounded-2xl bg-background-secondary/40 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
          <Icon className="h-4 w-4 text-violet-300" />
        </div>
        {badge && (
          <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-200">
            {badge}
          </span>
        )}
      </div>
      <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-text-secondary">
        {description}
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="glass-border mt-4 inline-flex items-center justify-center rounded-xl bg-white/[0.02] px-3 py-2 text-xs font-medium text-white transition hover:bg-white/[0.06] disabled:opacity-50"
      >
        {cta}
      </button>
    </div>
  );
}

function InfoModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close modal backdrop"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="glass-border relative z-10 w-full max-w-lg rounded-2xl bg-background-secondary p-6 shadow-2xl shadow-black/60">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="mt-3">{children}</div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
