import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/with-timeout";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface ProfileUpdateBody {
  full_name?: string | null;
  preferred_language?: string;
}

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  preferred_language: string | null;
}

const SUPPORTED_LANGUAGE_CODES = new Set<string>(
  SUPPORTED_LANGUAGES.map((lang) => lang.code),
);

export async function POST(request: Request) {
  try {
    let body: ProfileUpdateBody;
    try {
      body = (await request.json()) as ProfileUpdateBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await withTimeout(
      supabase.auth.getUser(),
      10000,
      "Authentication timed out.",
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    console.log("[api/settings/profile] received body:", body);

    const trimmedName =
      typeof body.full_name === "string" ? body.full_name.trim() : null;
    const fullName =
      trimmedName === null || trimmedName.length === 0 ? null : trimmedName.slice(0, 200);

    const rawLanguage = body.preferred_language;
    if (typeof rawLanguage !== "string" || rawLanguage.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing preferred_language in request body (received ${JSON.stringify(rawLanguage)}).`,
        },
        { status: 400 },
      );
    }
    if (!SUPPORTED_LANGUAGE_CODES.has(rawLanguage)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported preferred_language: ${rawLanguage}`,
        },
        { status: 400 },
      );
    }
    const language = rawLanguage;
    console.log("[api/settings/profile] writing preferred_language:", language);

    const email = user.email ?? null;

    const admin = createAdminClient();
    const { data, error } = await withTimeout(
      admin
        .from("user_profiles")
        .upsert(
          {
            id: user.id,
            email,
            full_name: fullName,
            preferred_language: language,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        )
        .select("id, email, full_name, preferred_language")
        .maybeSingle<ProfileRow>(),
      10000,
      "Saving profile timed out.",
    );

    if (error) {
      console.error("[api/settings/profile] upsert failed:", error);
      return NextResponse.json(
        { success: false, error: error.message || "Save failed" },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Profile row was not returned after save." },
        { status: 500 },
      );
    }

    console.log("[api/settings/profile] upsert returned:", data);

    return NextResponse.json({ success: true, profile: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save profile";
    console.error("[api/settings/profile] save failed:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
