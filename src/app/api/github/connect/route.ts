import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildGitHubAuthorizeUrl,
  getGitHubOAuthCookieNames,
  getSafeGitHubRedirectPath,
} from "@/lib/github/server";
import { isPaidPlan } from "@/lib/plans";
import type { Plan } from "@/types";

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

    // Gate: only Pro and Max users can connect GitHub for export.
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle<{ plan: Plan | null }>();
    const plan: Plan = (profile?.plan as Plan | null | undefined) ?? "free";
    if (!isPaidPlan(plan)) {
      const billingUrl = new URL("/billing", request.url);
      billingUrl.searchParams.set("upgrade", "github_export");
      return NextResponse.redirect(billingUrl);
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
