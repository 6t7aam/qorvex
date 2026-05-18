export type Plan = "free" | "pro" | "max";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: Plan;
  pending_plan?: "pro" | "max" | null;
  generations_used_this_week: number;
  week_reset_at?: string;
  preferred_language: string;
  ip_hash: string | null;
  abuse_detected: boolean;
  stripe_customer_id?: string | null;
  subscription_status?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_user_id: string;
  referred_user_id: string;
  referral_code: string;
  status: "signed_up" | "upgraded" | "rewarded";
  referred_plan: "pro" | "max" | null;
  signup_bonus_granted: boolean;
  reward_credits: number;
  created_at: string;
  upgraded_at: string | null;
  reward_granted_at: string | null;
}

export interface UserCreditAdjustment {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ProjectColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  prompt: string;
  status: "generating" | "ready" | "error" | "deployed";
  template_id: string | null;
  app_type: string;
  colors: ProjectColors;
  features: string[];
  generated_code: Record<string, string> | null;
  preview_url: string | null;
  github_repo: string | null;
  expo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Generation {
  id: string;
  user_id: string;
  project_id: string;
  prompt: string;
  model: string;
  provider?: string | null;
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  tokens_used: number | null;
  estimated_cost_usd?: number | null;
  status: "pending" | "processing" | "completed" | "failed";
  error: string | null;
  created_at: string;
}

export interface DailyAIUsage {
  id: string;
  user_id: string;
  usage_date: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  credits_used: number;
  request_count: number;
  active_requests: number;
  last_request_at: string | null;
  last_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ManualPayment {
  id: string;
  user_id: string;
  order_id: string;
  plan: "pro" | "max";
  amount: number;
  status: "pending" | "confirmed" | "rejected";
  screenshot_url: string | null;
  payment_comment: string | null;
  admin_note: string | null;
  confirmed_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_price_id?: string | null;
  plan: Plan;
  status: "active" | "canceled" | "past_due" | "trialing";
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface GithubConnection {
  id: string;
  user_id: string;
  github_user_id?: number | null;
  github_username: string;
  access_token: string;
  connected_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface GithubExport {
  id: string;
  project_id: string;
  user_id: string;
  repo_full_name: string;
  repo_url: string;
  branch: string;
  commit_sha: string;
  created_at: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  preview_image: string | null;
  base_prompt: string;
  features: string[];
  tags: string[];
  is_premium: boolean;
  usage_count: number;
  created_at: string;
}

export interface Deployment {
  id: string;
  project_id: string;
  user_id: string;
  platform: "vercel" | "expo" | "github";
  status: "pending" | "building" | "deployed" | "failed";
  url: string | null;
  build_logs: string | null;
  deployed_at: string | null;
  created_at: string;
}
