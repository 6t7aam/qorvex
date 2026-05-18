"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  Copy,
  KeyRound,
  Loader2,
  Lock,
  Save,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/stores/useAppStore";
import { createClient } from "@/lib/supabase/client";
import { withTimeout } from "@/lib/with-timeout";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";

export interface InitialProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  preferred_language: string | null;
}

interface SettingsClientProps {
  userId: string;
  email: string;
  initialProfile: InitialProfile;
}

type TabKey = "profile" | "account" | "notifications" | "api";

const TABS: { key: TabKey; label: string; icon: typeof UserIcon }[] = [
  { key: "profile", label: "Profile", icon: UserIcon },
  { key: "account", label: "Account", icon: Lock },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "api", label: "API", icon: KeyRound },
];

export function SettingsClient({ email, initialProfile }: SettingsClientProps) {
  const [active, setActive] = useState<TabKey>("profile");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-white">Settings</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Manage your account, preferences, and API access.
      </p>

      <div className="mt-8 flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-background-secondary/40 p-1.5">
        {TABS.map((t) => {
          const isActive = active === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-violet-500 text-white shadow-md shadow-violet-500/25"
                  : "text-text-secondary hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {active === "profile" && (
          <ProfileTab email={email} initialProfile={initialProfile} />
        )}
        {active === "account" && <AccountTab />}
        {active === "notifications" && <NotificationsTab />}
        {active === "api" && <ApiTab />}
      </div>
    </div>
  );
}

function ProfileTab({
  email: initialEmail,
  initialProfile,
}: Omit<SettingsClientProps, "userId">) {
  const router = useRouter();
  const setStoreUser = useAppStore((s) => s.setUser);
  const storedUser = useAppStore((s) => s.user);

  const [email, setEmail] = useState<string>(
    initialProfile.email ?? initialEmail ?? "",
  );
  const [fullName, setFullName] = useState<string>(initialProfile.full_name ?? "");
  const [language, setLanguage] = useState<string>(
    initialProfile.preferred_language ?? "en",
  );
  const [saving, setSaving] = useState(false);

  const initials = useMemo(
    () => deriveInitials(fullName, email),
    [fullName, email],
  );

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const trimmedName = fullName.trim();
      const payload = {
        full_name: trimmedName.length > 0 ? trimmedName : null,
        preferred_language: language,
      };
      console.log("[settings] saving payload:", payload);
      const response = await withTimeout(
        fetch("/api/settings/profile", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        15000,
        "Saving profile timed out. Please check your connection and try again.",
      );

      const body = (await response.json().catch(() => null)) as
        | { success?: boolean; error?: string; profile?: InitialProfile }
        | null;

      if (!response.ok || !body?.success) {
        const message = body?.error ?? `Save failed (${response.status})`;
        console.error("[settings] save failed:", message);
        toast.error(message);
        return;
      }

      const profile = body.profile;
      console.log("[settings] save response profile:", profile);
      if (profile) {
        setFullName(profile.full_name ?? "");
        setLanguage(profile.preferred_language ?? "en");
        if (profile.email) setEmail(profile.email);

        if (storedUser) {
          setStoreUser({
            ...storedUser,
            full_name: profile.full_name,
            preferred_language:
              profile.preferred_language ?? storedUser.preferred_language,
            email: profile.email ?? storedUser.email,
          });
        }
      }

      toast.success("Profile updated");
      router.refresh();
    } catch (err) {
      console.error("[settings] save threw:", err);
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <SectionHeading title="Profile" description="How you appear in Qorvex." />

      <div className="mt-6 flex items-center gap-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-2xl font-bold text-white shadow-lg shadow-violet-500/25">
          {initials}
        </div>
        <button
          type="button"
          onClick={() => toast("Avatar upload coming soon")}
          className="glass-border rounded-xl bg-white/[0.02] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.06]"
        >
          Change avatar
        </button>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <Field label="Full name">
          <input
            type="text"
            name="full_name"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            className="block w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white placeholder:text-text-muted focus:border-violet-500/50 focus:outline-none"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={email}
            readOnly
            className="block w-full cursor-not-allowed rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-sm text-text-secondary"
          />
        </Field>
        <Field label="Preferred language" className="sm:col-span-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="block w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option
                key={lang.code}
                value={lang.code}
                className="bg-background-secondary"
              >
                {lang.flag} {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="gradient-bg inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </Card>
  );
}

function AccountTab() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [updating, setUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function update() {
    if (!current || !next || !confirm) {
      toast.error("All password fields are required");
      return;
    }
    if (next !== confirm) {
      toast.error("New password and confirmation don't match");
      return;
    }
    if (next.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setUpdating(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Password updated");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <SectionHeading
          title="Change password"
          description="Use a strong, unique password."
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Field label="Current password">
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="block w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none"
            />
          </Field>
          <Field label="New password">
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className="block w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none"
            />
          </Field>
          <Field label="Confirm new password">
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="block w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none"
            />
          </Field>
        </div>
        <div className="mt-6">
          <button
            type="button"
            onClick={update}
            disabled={updating}
            className="gradient-bg inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Update password
          </button>
        </div>
      </Card>

      <div className="rounded-2xl border border-red-500/30 bg-red-500/[0.04] p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/15 text-red-300 ring-1 ring-red-500/30">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white">Danger zone</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Permanently delete your account and all associated data.
            </p>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
          >
            <Trash2 className="h-4 w-4" />
            Delete account
          </button>
        ) : (
          <div className="mt-5 rounded-xl border border-red-500/30 bg-black/30 p-4">
            <p className="text-sm text-red-200">
              Are you sure? This action cannot be undone.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  toast(
                    "Contact support to delete your account: support@qorvex.app",
                  );
                  setShowDeleteConfirm(false);
                }}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400"
              >
                Yes, delete
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="glass-border rounded-xl bg-white/[0.02] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.06]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    generationComplete: true,
    weeklySummary: false,
    productUpdates: true,
    marketing: false,
  });
  const [saving, setSaving] = useState(false);

  function save() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Preferences saved");
    }, 400);
  }

  return (
    <Card>
      <SectionHeading
        title="Notifications"
        description="Choose what we email you about."
      />
      <div className="mt-6 space-y-3">
        <Toggle
          label="Generation complete"
          description="Email me when an app generation finishes."
          checked={prefs.generationComplete}
          onChange={(v) => setPrefs((p) => ({ ...p, generationComplete: v }))}
        />
        <Toggle
          label="Weekly usage summary"
          description="A digest of your generations and projects."
          checked={prefs.weeklySummary}
          onChange={(v) => setPrefs((p) => ({ ...p, weeklySummary: v }))}
        />
        <Toggle
          label="Product updates and new features"
          description="Stay in the loop on what's shipping."
          checked={prefs.productUpdates}
          onChange={(v) => setPrefs((p) => ({ ...p, productUpdates: v }))}
        />
        <Toggle
          label="Marketing emails"
          description="Offers, tips, and occasional promotions."
          checked={prefs.marketing}
          onChange={(v) => setPrefs((p) => ({ ...p, marketing: v }))}
        />
      </div>
      <div className="mt-6">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="gradient-bg inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save preferences
        </button>
      </div>
    </Card>
  );
}

function ApiTab() {
  const maskedKey = "qvx_••••••••••••••••";

  return (
    <Card>
      <SectionHeading
        title="API access"
        description="Build with Qorvex programmatically."
      />

      <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-5">
        <div className="text-xs uppercase tracking-wider text-text-muted">
          Your API key
        </div>
        <div className="mt-2 flex items-center gap-3">
          <code className="flex-1 truncate rounded-lg bg-black/40 px-3 py-2 font-mono text-sm text-violet-200">
            {maskedKey}
          </code>
          <button
            type="button"
            onClick={() => toast(`Coming soon: API key management`)}
            className="glass-border rounded-xl bg-white/[0.02] px-3 py-2 text-xs font-medium text-white transition hover:bg-white/[0.06]"
            aria-label="Copy"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => toast("Coming soon: API key generation")}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/20"
        >
          Generate new key
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4">
        <div>
          <div className="text-sm font-semibold text-white">
            API Documentation
          </div>
          <p className="mt-0.5 text-xs text-text-secondary">
            Reference, examples, and SDKs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => toast("Coming soon")}
          className="text-sm text-violet-300 transition hover:text-violet-200"
        >
          View docs →
        </button>
      </div>

      <p className="mt-5 text-xs text-text-muted">
        API access is coming soon in a future update.
      </p>
    </Card>
  );
}

// ============ shared bits ============

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-border rounded-2xl bg-background-secondary/40 p-6 sm:p-8">
      {children}
    </div>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block space-y-1.5 ${className ?? ""}`}>
      <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{label}</div>
        {description && (
          <div className="mt-0.5 text-xs text-text-secondary">{description}</div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-violet-500" : "bg-white/10"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function deriveInitials(name: string | null | undefined, email: string | undefined): string {
  const source = (name?.trim() && name) || email?.split("@")[0] || "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
