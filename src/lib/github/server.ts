import { Octokit } from "@octokit/rest";
import { getDownloadableProjectFiles } from "@/lib/project-artifacts";
import type { Project } from "@/types";

const DEFAULT_BRANCH = "main";
const OAUTH_STATE_COOKIE = "qorvex_github_oauth_state";
const OAUTH_REDIRECT_COOKIE = "qorvex_github_oauth_redirect";

export interface StoredGitHubConnection {
  id: string;
  user_id: string;
  github_username: string;
  access_token: string;
  connected_at: string;
}

export interface GitHubConnectionStatus {
  connected: boolean;
  githubUsername: string | null;
  connectedAt: string | null;
}

export interface GitHubRepoSummary {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
  html_url: string;
}

export interface GitHubExportTarget {
  repoFullName: string;
  owner: string;
  repo: string;
  branch: string;
  fallbackBranch: string;
  repoUrl: string;
}

type SupabaseAdminLike = {
  from: (table: string) => unknown;
};

function ensureEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

export function getGitHubAppConfig() {
  const clientId = ensureEnv("GITHUB_CLIENT_ID");
  const clientSecret = ensureEnv("GITHUB_CLIENT_SECRET");
  const appUrl = ensureEnv("NEXT_PUBLIC_APP_URL").replace(/\/+$/, "");

  return { clientId, clientSecret, appUrl };
}

export function getGitHubOAuthCookieNames() {
  return {
    state: OAUTH_STATE_COOKIE,
    redirect: OAUTH_REDIRECT_COOKIE,
  };
}

export function getSafeGitHubRedirectPath(input: string | null | undefined) {
  if (!input || !input.startsWith("/") || input.startsWith("//")) {
    return "/billing";
  }

  return input;
}

export function buildGitHubAuthorizeUrl(state: string) {
  const { clientId, appUrl } = getGitHubAppConfig();
  const callbackUrl = `${appUrl}/api/github/callback`;
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("scope", "repo read:user user:email");
  url.searchParams.set("state", state);
  url.searchParams.set("allow_signup", "true");
  return url.toString();
}

export async function exchangeGitHubCodeForToken(code: string) {
  const { clientId, clientSecret } = getGitHubAppConfig();
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        access_token?: string;
        error?: string;
        error_description?: string;
      }
    | null;

  if (!response.ok || !payload?.access_token) {
    throw new Error(
      payload?.error_description ??
        payload?.error ??
        "GitHub OAuth token exchange failed.",
    );
  }

  return payload.access_token;
}

export function createGitHubClient(accessToken: string) {
  return new Octokit({
    auth: accessToken,
    request: {
      timeout: 30_000,
    },
    userAgent: "Qorvex",
  });
}

export async function getStoredGitHubConnection(
  admin: SupabaseAdminLike,
  userId: string,
) {
  const query = admin.from("github_connections") as {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{
          data: StoredGitHubConnection | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
  const { data, error } = await query
    .select("id, user_id, github_username, access_token, connected_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load GitHub connection.");
  }

  return data;
}

export async function upsertGitHubConnection(
  admin: SupabaseAdminLike,
  input: {
    userId: string;
    githubUserId: number;
    githubUsername: string;
    accessToken: string;
  },
) {
  const now = new Date().toISOString();
  const table = admin.from("github_connections") as {
    upsert: (
      values: Record<string, unknown>,
      options?: { onConflict?: string },
    ) => Promise<{ error: { message: string } | null }>;
  };
  const extendedPayload = {
    user_id: input.userId,
    github_user_id: input.githubUserId,
    github_username: input.githubUsername,
    access_token: input.accessToken,
    connected_at: now,
    created_at: now,
    updated_at: now,
  };

  const extendedResult = await table.upsert(extendedPayload, {
    onConflict: "user_id",
  });

  if (!extendedResult.error) {
    return;
  }

  if (!/column .* does not exist/i.test(extendedResult.error.message)) {
    throw new Error(
      extendedResult.error.message || "Failed to save GitHub connection.",
    );
  }

  const fallbackResult = await table.upsert(
    {
      user_id: input.userId,
      github_username: input.githubUsername,
      access_token: input.accessToken,
      connected_at: now,
    },
    { onConflict: "user_id" },
  );

  if (fallbackResult.error) {
    throw new Error(
      fallbackResult.error.message || "Failed to save GitHub connection.",
    );
  }
}

export async function getGitHubAuthenticatedUser(octokit: Octokit) {
  const { data } = await octokit.rest.users.getAuthenticated();
  return {
    id: data.id,
    login: data.login,
    htmlUrl: data.html_url,
  };
}

export function toGitHubConnectionStatus(
  connection: StoredGitHubConnection | null,
): GitHubConnectionStatus {
  return {
    connected: !!connection,
    githubUsername: connection?.github_username ?? null,
    connectedAt: connection?.connected_at ?? null,
  };
}

export async function listOwnedGitHubRepos(
  octokit: Octokit,
  query?: string,
) {
  const repos = await octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
    per_page: 100,
    sort: "updated",
    affiliation: "owner",
    visibility: "all",
  });

  const loweredQuery = query?.trim().toLowerCase() ?? "";
  return repos
    .filter((repo) => {
      if (!loweredQuery) return true;
      return (
        repo.name.toLowerCase().includes(loweredQuery) ||
        repo.full_name.toLowerCase().includes(loweredQuery)
      );
    })
    .map<GitHubRepoSummary>((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      private: repo.private,
      default_branch: repo.default_branch || DEFAULT_BRANCH,
      html_url: repo.html_url,
    }));
}

export function parseRepoFullName(repoFullName: string) {
  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo) {
    throw new Error("Repository must be in the format owner/name.");
  }

  return { owner, repo };
}

export async function ensureGitHubRepoAccess(
  octokit: Octokit,
  connection: StoredGitHubConnection,
  repoFullName: string,
) {
  const { owner, repo } = parseRepoFullName(repoFullName);
  const { data } = await octokit.rest.repos.get({ owner, repo });

  if (data.owner?.login?.toLowerCase() !== connection.github_username.toLowerCase()) {
    throw new Error("Selected repository must belong to your connected GitHub account.");
  }

  if (!data.permissions?.push) {
    throw new Error("Qorvex does not have permission to push to that repository.");
  }

  return {
    repoFullName: data.full_name,
    owner,
    repo,
    branch: data.default_branch || DEFAULT_BRANCH,
    fallbackBranch: data.default_branch || DEFAULT_BRANCH,
    repoUrl: data.html_url,
  } satisfies GitHubExportTarget;
}

function buildReadme(project: Project) {
  return `# ${project.name}

Generated with Qorvex.

## Overview

${project.description ?? project.prompt}

## Getting started

\`\`\`bash
npm install
npm run start
\`\`\`

This repository contains the exported Expo / React Native project files generated for ${project.name}.
`;
}

function buildGitIgnore() {
  return `node_modules
.expo
.expo-shared
dist
web-build
npm-debug.*
yarn-debug.*
yarn-error.*
.DS_Store
*.log
`;
}

export function getGitHubExportFiles(project: Project) {
  const generated = getDownloadableProjectFiles(
    (project.generated_code ?? {}) as Record<string, string>,
  );
  const files = { ...generated };

  delete files[".env"];
  delete files[".env.local"];

  if (!files["README.md"]) {
    files["README.md"] = buildReadme(project);
  }

  if (!files[".gitignore"]) {
    files[".gitignore"] = buildGitIgnore();
  }

  return files;
}

async function getGitHubBaseRefContext(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
  fallbackBranch: string,
) {
  const targetRef = `heads/${branch}`;

  try {
    const { data: branchRef } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: targetRef,
    });

    const { data: commit } = await octokit.rest.git.getCommit({
      owner,
      repo,
      commit_sha: branchRef.object.sha,
    });

    return {
      branchExists: true,
      ref: `refs/${targetRef}`,
      parentCommitSha: branchRef.object.sha,
      baseTreeSha: commit.tree.sha,
    };
  } catch (error) {
    if ((error as { status?: number }).status !== 404) {
      throw error;
    }
  }

  if (fallbackBranch && fallbackBranch !== branch) {
    try {
      const { data: fallbackRef } = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${fallbackBranch}`,
      });

      const { data: commit } = await octokit.rest.git.getCommit({
        owner,
        repo,
        commit_sha: fallbackRef.object.sha,
      });

      return {
        branchExists: false,
        ref: `refs/${targetRef}`,
        parentCommitSha: fallbackRef.object.sha,
        baseTreeSha: commit.tree.sha,
      };
    } catch (error) {
      if ((error as { status?: number }).status !== 404) {
        throw error;
      }
    }
  }

  return {
    branchExists: false,
    ref: `refs/${targetRef}`,
    parentCommitSha: null,
    baseTreeSha: null,
  };
}

export async function pushProjectFilesToGitHub(input: {
  octokit: Octokit;
  project: Project;
  target: GitHubExportTarget;
  commitMessage?: string;
}) {
  const files = getGitHubExportFiles(input.project);
  const fileEntries = Object.entries(files);

  if (fileEntries.length === 0) {
    throw new Error("No generated files are available to export.");
  }

  const base = await getGitHubBaseRefContext(
    input.octokit,
    input.target.owner,
    input.target.repo,
    input.target.branch,
    input.target.fallbackBranch,
  );

  const { data: tree } = await input.octokit.rest.git.createTree({
    owner: input.target.owner,
    repo: input.target.repo,
    base_tree: base.baseTreeSha ?? undefined,
    tree: fileEntries.map(([path, content]) => ({
      path,
      mode: "100644",
      type: "blob",
      content,
    })),
  });

  const { data: commit } = await input.octokit.rest.git.createCommit({
    owner: input.target.owner,
    repo: input.target.repo,
    message: input.commitMessage ?? "Export Qorvex generated app",
    tree: tree.sha,
    parents: base.parentCommitSha ? [base.parentCommitSha] : [],
  });

  if (base.branchExists) {
    await input.octokit.rest.git.updateRef({
      owner: input.target.owner,
      repo: input.target.repo,
      ref: `heads/${input.target.branch}`,
      sha: commit.sha,
      force: true,
    });
  } else {
    await input.octokit.rest.git.createRef({
      owner: input.target.owner,
      repo: input.target.repo,
      ref: `refs/heads/${input.target.branch}`,
      sha: commit.sha,
    });
  }

  return {
    commitSha: commit.sha,
    repoUrl: input.target.repoUrl,
    commitUrl: `${input.target.repoUrl}/commit/${commit.sha}`,
    filesPushed: fileEntries.length,
  };
}

export async function recordGitHubExport(
  admin: SupabaseAdminLike,
  input: {
    projectId: string;
    userId: string;
    repoFullName: string;
    repoUrl: string;
    branch: string;
    commitSha: string;
  },
) {
  const exportsTable = admin.from("github_exports") as {
    insert: (
      values: Record<string, unknown>,
    ) => Promise<{
      error: { message: string } | null;
    }>;
  };
  const result = await exportsTable.insert({
    project_id: input.projectId,
    user_id: input.userId,
    repo_full_name: input.repoFullName,
    repo_url: input.repoUrl,
    branch: input.branch,
    commit_sha: input.commitSha,
  });

  if (result.error) {
    if (
      /relation .*github_exports.* does not exist/i.test(result.error.message)
    ) {
      console.warn(
        "[github] github_exports table missing, skipping export metadata insert.",
      );
      return;
    }

    console.error("[github] export metadata insert failed:", result.error);
  }
}

export function normalizeGitHubError(error: unknown) {
  const status = (error as { status?: number }).status;
  const message =
    error instanceof Error ? error.message : "GitHub request failed.";

  if (status === 401) {
    return {
      status: 401,
      message: "Your GitHub connection expired. Please reconnect GitHub.",
      reconnectRequired: true,
    };
  }

  if (status === 403 && /rate limit/i.test(message)) {
    return {
      status: 429,
      message: "GitHub rate limit reached. Please try again later.",
      reconnectRequired: false,
    };
  }

  if (status === 404) {
    return {
      status: 404,
      message: "The selected GitHub repository could not be found.",
      reconnectRequired: false,
    };
  }

  if (status === 422) {
    return {
      status: 422,
      message,
      reconnectRequired: false,
    };
  }

  return {
    status: status && status >= 400 ? status : 500,
    message,
    reconnectRequired: false,
  };
}
