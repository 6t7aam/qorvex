import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  REFERRAL_MAX_REWARD_CREDITS,
  REFERRAL_PRO_REWARD_CREDITS,
  REFERRAL_SIGNUP_BONUS_CREDITS,
} from "@/lib/referrals";
import type {
  Plan,
  Referral,
  ReferralCode,
  UserCreditAdjustment,
  UserProfile,
} from "@/types";
export const BONUS_USAGE_REASON = "bonus_credit_usage";
export const REFERRAL_SIGNUP_BONUS_REASON = "referral_signup_bonus";
export const REFERRAL_PAID_UPGRADE_REASON = "referral_paid_upgrade";

interface ReferralStats {
  totalInvitedUsers: number;
  paidUpgrades: number;
  pendingReferrals: number;
  bonusCreditsEarned: number;
}

export interface ReferralRecentRow {
  id: string;
  maskedUser: string;
  status: Referral["status"];
  plan: Referral["referred_plan"];
  rewardCredits: number;
  createdAt: string;
  upgradedAt: string | null;
  rewardGrantedAt: string | null;
}

export interface ReferralOverview {
  referralCode: string;
  referralLink: string;
  stats: ReferralStats;
  recentReferrals: ReferralRecentRow[];
  wasReferred: boolean;
  referralStatus: Referral["status"] | null;
  signupBonusGranted: boolean;
}

function makeCodeSuffix() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let index = 0; index < 6; index += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return suffix;
}

function makeReferralCode() {
  return `QORVEX-${makeCodeSuffix()}`;
}

export function getReferralLink(code: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ??
    "http://localhost:3000";
  return `${baseUrl}/signup?ref=${encodeURIComponent(code)}`;
}

export function getReferralRewardCredits(plan: Plan | "pro" | "max") {
  if (plan === "max") return REFERRAL_MAX_REWARD_CREDITS;
  if (plan === "pro") return REFERRAL_PRO_REWARD_CREDITS;
  return 0;
}

export function maskEmail(email: string | null | undefined) {
  if (!email) return "New user";
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  const visible = name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
}

async function grantCreditAdjustment(
  admin: SupabaseClient,
  input: {
    userId: string;
    amount: number;
    reason: string;
    metadata?: Record<string, unknown>;
  },
) {
  const { error } = await admin.from("user_credit_adjustments").insert({
    user_id: input.userId,
    amount: input.amount,
    reason: input.reason,
    metadata: input.metadata ?? null,
  });

  if (error) {
    throw error;
  }
}

export async function getUserBonusCreditBalance(
  admin: SupabaseClient,
  userId: string,
) {
  const { data, error } = await admin
    .from("user_credit_adjustments")
    .select("amount")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return ((data ?? []) as Pick<UserCreditAdjustment, "amount">[]).reduce(
    (sum, row) => sum + (row.amount ?? 0),
    0,
  );
}

export async function consumeBonusCredits(
  admin: SupabaseClient,
  input: {
    userId: string;
    amount: number;
    usageDate: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  },
) {
  if (input.amount <= 0) return;

  const balance = await getUserBonusCreditBalance(admin, input.userId);
  if (balance < input.amount) {
    throw new Error("Your bonus AI credits are too low to continue this request.");
  }

  await grantCreditAdjustment(admin, {
    userId: input.userId,
    amount: -Math.abs(input.amount),
    reason: BONUS_USAGE_REASON,
    metadata: {
      usage_date: input.usageDate,
      prompt_tokens: input.promptTokens,
      completion_tokens: input.completionTokens,
      total_tokens: input.totalTokens,
    },
  });
}

export async function ensureReferralCode(
  admin: SupabaseClient,
  userId: string,
) {
  const { data: existing, error: existingError } = await admin
    .from("referral_codes")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<ReferralCode>();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return existing;
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = makeReferralCode();
    const { data, error } = await admin
      .from("referral_codes")
      .insert({
        user_id: userId,
        code,
      })
      .select("*")
      .single<ReferralCode>();

    if (!error && data) {
      return data;
    }

    if (error && !/duplicate key/i.test(error.message)) {
      throw error;
    }
  }

  throw new Error("Could not generate a unique referral code.");
}

export async function getReferralForReferredUser(
  admin: SupabaseClient,
  userId: string,
) {
  const { data, error } = await admin
    .from("referrals")
    .select("*")
    .eq("referred_user_id", userId)
    .maybeSingle<Referral>();

  if (error) {
    throw error;
  }

  return data;
}

async function applySignupBonusIfNeeded(
  admin: SupabaseClient,
  referral: Referral,
) {
  if (referral.signup_bonus_granted) {
    return referral;
  }

  const { data: updated, error } = await admin
    .from("referrals")
    .update({
      signup_bonus_granted: true,
    })
    .eq("id", referral.id)
    .eq("signup_bonus_granted", false)
    .select("*")
    .maybeSingle<Referral>();

  if (error) {
    throw error;
  }

  if (!updated) {
    const latest = await getReferralForReferredUser(admin, referral.referred_user_id);
    return latest ?? referral;
  }

  await grantCreditAdjustment(admin, {
    userId: referral.referred_user_id,
    amount: REFERRAL_SIGNUP_BONUS_CREDITS,
    reason: REFERRAL_SIGNUP_BONUS_REASON,
    metadata: {
      referral_id: referral.id,
      referral_code: referral.referral_code,
      referrer_user_id: referral.referrer_user_id,
    },
  });

  return updated;
}

export async function claimReferralSignup(
  admin: SupabaseClient,
  input: {
    referredUserId: string;
    referralCode: string;
  },
) {
  const normalizedCode = input.referralCode.trim().toUpperCase();
  if (!normalizedCode) {
    return {
      success: false,
      error: "Referral code is missing.",
    };
  }

  const { data: codeRow, error: codeError } = await admin
    .from("referral_codes")
    .select("*")
    .eq("code", normalizedCode)
    .maybeSingle<ReferralCode>();

  if (codeError) {
    throw codeError;
  }

  if (!codeRow) {
    return {
      success: false,
      error: "Referral code was not found.",
    };
  }

  if (codeRow.user_id === input.referredUserId) {
    return {
      success: false,
      error: "Self-referrals are not allowed.",
    };
  }

  let referral = await getReferralForReferredUser(admin, input.referredUserId);
  if (!referral) {
    const { data: created, error: insertError } = await admin
      .from("referrals")
      .insert({
        referrer_user_id: codeRow.user_id,
        referred_user_id: input.referredUserId,
        referral_code: normalizedCode,
        status: "signed_up",
      })
      .select("*")
      .maybeSingle<Referral>();

    if (insertError) {
      if (/duplicate key/i.test(insertError.message)) {
        referral = await getReferralForReferredUser(admin, input.referredUserId);
      } else {
        throw insertError;
      }
    } else {
      referral = created;
    }
  }

  if (!referral) {
    return {
      success: false,
      error: "Referral could not be created.",
    };
  }

  if (referral.referrer_user_id === input.referredUserId) {
    return {
      success: false,
      error: "Self-referrals are not allowed.",
    };
  }

  const updatedReferral = await applySignupBonusIfNeeded(admin, referral);
  return {
    success: true,
    referral: updatedReferral,
  };
}

export async function grantReferralReward(
  admin: SupabaseClient,
  input: {
    referredUserId: string;
    plan: Plan;
  },
) {
  if (input.plan !== "pro" && input.plan !== "max") {
    return {
      success: false,
      rewarded: false,
      error: "Referral rewards are only granted for Pro or Max upgrades.",
    };
  }

  const referral = await getReferralForReferredUser(admin, input.referredUserId);
  if (!referral) {
    return {
      success: true,
      rewarded: false,
      reason: "No referral found for this user.",
    };
  }

  if (referral.referrer_user_id === input.referredUserId) {
    return {
      success: false,
      rewarded: false,
      error: "Self-referrals are not eligible for rewards.",
    };
  }

  if (referral.reward_granted_at) {
    return {
      success: true,
      rewarded: false,
      reason: "Referral reward was already granted.",
      referral,
    };
  }

  const rewardCredits = getReferralRewardCredits(input.plan);
  const nowIso = new Date().toISOString();
  const nextStatus: Referral["status"] = "rewarded";

  const { data: updated, error: updateError } = await admin
    .from("referrals")
    .update({
      status: nextStatus,
      referred_plan: input.plan,
      upgraded_at: nowIso,
      reward_granted_at: nowIso,
      reward_credits: rewardCredits,
    })
    .eq("id", referral.id)
    .is("reward_granted_at", null)
    .select("*")
    .maybeSingle<Referral>();

  if (updateError) {
    throw updateError;
  }

  if (!updated) {
    const latest = await getReferralForReferredUser(admin, input.referredUserId);
    return {
      success: true,
      rewarded: false,
      reason: "Referral reward was already granted.",
      referral: latest ?? referral,
    };
  }

  await grantCreditAdjustment(admin, {
    userId: updated.referrer_user_id,
    amount: rewardCredits,
    reason: REFERRAL_PAID_UPGRADE_REASON,
    metadata: {
      referral_id: updated.id,
      referred_user_id: updated.referred_user_id,
      plan: input.plan,
    },
  });

  return {
    success: true,
    rewarded: true,
    rewardCredits,
    referral: updated,
  };
}

export async function getReferralOverview(
  admin: SupabaseClient,
  user: Pick<UserProfile, "id">,
) {
  const referralCodeRow = await ensureReferralCode(admin, user.id);
  const { data: referrals, error: referralsError } = await admin
    .from("referrals")
    .select("*")
    .eq("referrer_user_id", user.id)
    .order("created_at", { ascending: false });

  if (referralsError) {
    throw referralsError;
  }

  const rows = (referrals ?? []) as Referral[];
  const referredIds = rows.map((row) => row.referred_user_id);
  let emailMap = new Map<string, string>();

  if (referredIds.length > 0) {
    const { data: referredProfiles, error: referredProfilesError } = await admin
      .from("user_profiles")
      .select("id, email")
      .in("id", referredIds);

    if (referredProfilesError) {
      throw referredProfilesError;
    }

    emailMap = new Map(
      ((referredProfiles ?? []) as Pick<UserProfile, "id" | "email">[]).map(
        (profile) => [profile.id, profile.email],
      ),
    );
  }

  const ownReferral = await getReferralForReferredUser(admin, user.id);

  return {
    referralCode: referralCodeRow.code,
    referralLink: getReferralLink(referralCodeRow.code),
    stats: {
      totalInvitedUsers: rows.length,
      paidUpgrades: rows.filter((row) => row.referred_plan === "pro" || row.referred_plan === "max").length,
      pendingReferrals: rows.filter((row) => row.status === "signed_up").length,
      bonusCreditsEarned: rows.reduce(
        (sum, row) => sum + (row.reward_credits ?? 0),
        0,
      ),
    },
    recentReferrals: rows.slice(0, 10).map<ReferralRecentRow>((row) => ({
      id: row.id,
      maskedUser: maskEmail(emailMap.get(row.referred_user_id)),
      status: row.status,
      plan: row.referred_plan,
      rewardCredits: row.reward_credits ?? 0,
      createdAt: row.created_at,
      upgradedAt: row.upgraded_at,
      rewardGrantedAt: row.reward_granted_at,
    })),
    wasReferred: !!ownReferral,
    referralStatus: ownReferral?.status ?? null,
    signupBonusGranted: ownReferral?.signup_bonus_granted ?? false,
  } satisfies ReferralOverview;
}
