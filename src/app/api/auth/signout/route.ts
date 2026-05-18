import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { withTimeout } from "@/lib/with-timeout";

export const dynamic = "force-dynamic";

function clearSupabaseCookies(request: NextRequest, response: NextResponse) {
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-") || cookie.name.includes("supabase")) {
      response.cookies.set(cookie.name, "", {
        expires: new Date(0),
        maxAge: 0,
        path: "/",
      });
    }
  }
}

function createRouteClient(request: NextRequest, response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}

async function finalizeSignOut(
  request: NextRequest,
  response: NextResponse,
): Promise<NextResponse> {
  try {
    const supabase = createRouteClient(request, response);
    if (supabase) {
      await withTimeout(
        supabase.auth.signOut(),
        5000,
        "Server sign out timed out.",
      );
    }
  } catch (error) {
    console.error("[auth signout] failed:", error);
  }

  clearSupabaseCookies(request, response);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  return finalizeSignOut(request, response);
}

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  return finalizeSignOut(request, response);
}
