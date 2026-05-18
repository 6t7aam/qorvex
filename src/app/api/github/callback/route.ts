import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import {
  createGitHubClient,
  exchangeGitHubCodeForToken,
  getGitHubAuthenticatedUser,
  getGitHubOAuthCookieNames,
  getSafeGitHubRedirectPath,
  upsertGitHubConnection,
} from "@/lib/github/server";

export const dynamic = "force-dynamic";

function buildRedirect(requestUrl: string, redirectTo: string, status: string, message?: string) {
  const url = new URL(redirectTo, requestUrl);
  url.searchParams.set("github", status);
  if (message) {
    url.searchParams.set("githubMessage", message);
  }
  return url;
}

export async function GET(request: Request) {
  const requestUrl = request.url;
  const callbackUrl = new URL(requestUrl);
  const code = callbackUrl.searchParams.get("code");
  const state = callbackUrl.searchParams.get("state");
  const gitHubError = callbackUrl.searchParams.get("error");
  const cookieNames = getGitHubOAuthCookieNames();

  const redirectTo = getSafeGitHubRedirectPath(
    callbackUrl.searchParams.get("redirectTo") ?? null,
  );

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        buildRedirect(requestUrl, redirectTo, "error", "Please sign in and try GitHub again."),
      );
    }

    const cookieStore = await cookies();
    const expectedState = cookieStore.get(cookieNames.state)?.value ?? null;
    const storedRedirect = getSafeGitHubRedirectPath(
      cookieStore.get(cookieNames.redirect)?.value ?? redirectTo,
    );

    if (gitHubError) {
      const response = NextResponse.redirect(
        buildRedirect(
          requestUrl,
          storedRedirect,
          "error",
          "GitHub authorization was canceled or denied.",
        ),
      );
      response.cookies.delete(cookieNames.state);
      response.cookies.delete(cookieNames.redirect);
      return response;
    }

    if (!code || !state || !expectedState || state !== expectedState) {
      const response = NextResponse.redirect(
        buildRedirect(
          requestUrl,
          storedRedirect,
          "error",
          "GitHub OAuth state validation failed.",
        ),
      );
      response.cookies.delete(cookieNames.state);
      response.cookies.delete(cookieNames.redirect);
      return response;
    }

    const accessToken = await exchangeGitHubCodeForToken(code);
    const octokit = createGitHubClient(accessToken);
    const gitHubUser = await getGitHubAuthenticatedUser(octokit);
    const admin = createAdminClient();

    await upsertGitHubConnection(admin, {
      userId: user.id,
      githubUserId: gitHubUser.id,
      githubUsername: gitHubUser.login,
      accessToken,
    });

    const response = NextResponse.redirect(
      buildRedirect(requestUrl, storedRedirect, "connected"),
    );
    response.cookies.delete(cookieNames.state);
    response.cookies.delete(cookieNames.redirect);
    return response;
  } catch (error) {
    console.error("[github/callback] failed:", error);
    const response = NextResponse.redirect(
      buildRedirect(
        requestUrl,
        redirectTo,
        "error",
        error instanceof Error ? error.message : "GitHub connection failed.",
      ),
    );
    response.cookies.delete(cookieNames.state);
    response.cookies.delete(cookieNames.redirect);
    return response;
  }
}
