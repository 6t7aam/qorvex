import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isPaidPlan } from "@/lib/plans";
import type { Plan } from "@/types";

interface GateContext {
  supabase: SupabaseClient;
  user: User;
  plan: Plan;
}

interface GateSuccess {
  ok: true;
  context: GateContext;
}

interface GateFailure {
  ok: false;
  response: NextResponse;
}

export async function requirePaidPlan(): Promise<GateSuccess | GateFailure> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle<{ plan: Plan | null }>();

  const plan: Plan = (profile?.plan as Plan | null | undefined) ?? "free";

  if (!isPaidPlan(plan)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "GitHub export requires Pro or Max plan.",
          upgradeRequired: true,
        },
        { status: 403 },
      ),
    };
  }

  return { ok: true, context: { supabase, user, plan } };
}
