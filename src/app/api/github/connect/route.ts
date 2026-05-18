import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildGitHubAuthorizeUrl,
  getGitHubOAuthCookieNames,
  getSafeGitHubRedirectPath,
} from "@/lib/github/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", "/billing");
      return NextResponse.redirect(loginUrl);
    }

    const url = new URL(request.url);
    const redirectTo = getSafeGitHubRedirectPath(
      url.searchParams.get("redirectTo"),
    );
    const state = randomUUID();

    const response = NextResponse.redirect(buildGitHubAuthorizeUrl(state));
    const cookieNames = getGitHubOAuthCookieNames();

    response.cookies.set(cookieNames.state, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });
    response.cookies.set(cookieNames.redirect, redirectTo, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });

    return response;
  } catch (error) {
    console.error("[github/connect] failed:", error);
    const fallback = new URL("/billing", request.url);
    fallback.searchParams.set("github", "error");
    fallback.searchParams.set(
      "githubMessage",
      error instanceof Error ? error.message : "GitHub connection failed.",
    );
    return NextResponse.redirect(fallback);
  }
}
