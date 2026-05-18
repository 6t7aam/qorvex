# Qorvex Status

Last updated: 2026-05-18

## Required Supabase SQL (run before /dashboard will fully load)

The `daily_ai_usage` table and the new token / cost columns on `generations` must
exist in the live Supabase project, otherwise the dashboard renders a degraded
state (no AI credit card) and logs a Supabase error server-side.

Apply [supabase/migration_daily_ai_credits.sql](supabase/migration_daily_ai_credits.sql)
in the Supabase SQL editor. It is idempotent and equivalent to:

```sql
alter table public.generations
  add column if not exists provider text not null default 'anthropic',
  add column if not exists prompt_tokens integer,
  add column if not exists completion_tokens integer,
  add column if not exists estimated_cost_usd numeric(12, 6);

create table if not exists public.daily_ai_usage (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  usage_date date not null,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer not null default 0,
  estimated_cost_usd numeric(12, 6) not null default 0,
  credits_used integer not null default 0,
  request_count integer not null default 0,
  active_requests integer not null default 0,
  last_request_at timestamptz,
  last_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, usage_date)
);

create index if not exists idx_daily_ai_usage_user_id
  on public.daily_ai_usage(user_id);

create index if not exists idx_daily_ai_usage_usage_date
  on public.daily_ai_usage(usage_date);

alter table public.daily_ai_usage enable row level security;

drop policy if exists "Users can view own daily ai usage" on public.daily_ai_usage;
create policy "Users can view own daily ai usage"
  on public.daily_ai_usage for select
  using (auth.uid() = user_id);
```

Until that is applied, `/dashboard` now logs the underlying Supabase error
server-side and shows a non-fatal warning banner instead of crashing the page.


## Completed modules

- Marketing pages: landing page, pricing page, core landing sections.
- Auth UI: login, signup, OAuth callback route, POST/GET server sign-out route, dashboard auth protection via `src/proxy.ts`.
- Dashboard shell: sidebar navigation, account badge, protected dashboard layout.
- Projects: project list, project detail page, generated-code tabs, persistent live AI editor, server-backed single project deletion, server-backed bulk deletion for error projects, portal dropdown actions menu, download export route.
- Generator: prompt form, template/color/platform options, staged generation progress UI, `/api/generate` staged NDJSON route, generated file preview, provider-aware follow-up AI chat route, and daily AI credit usage indicators.
- Billing foundation: billing page, Stripe checkout route, Stripe portal route, webhook subscription sync route.
- Manual payments: authenticated screenshot upload route, private Supabase Storage bucket flow, admin screenshot signed-URL route, pending payment tracking, and manual payment approval/rejection routes.
- Supabase foundation: browser client, server client, service-role admin client, schema, seed data, RLS policies.
- GitHub export: authenticated OAuth connect/callback routes, sanitized GitHub status route, repo list/create routes, server-side project export route, project Deploy modal flow, and export metadata tracking.

## Current architecture

- Framework: Next.js 16 App Router with React 19 and TypeScript.
- UI: Tailwind CSS, client components for interactive dashboard/generator flows, server components for protected data loading.
- State: Zustand stores for app/user/subscription, generation flow, and UI modal state.
- Data: Supabase Auth and Postgres. Browser components import `@/lib/supabase/client`; server pages and API routes import `@/lib/supabase/server`.
- Privileged writes: service-role admin client is only used server-side for generation persistence, daily AI usage tracking, Stripe webhook sync, auth callback cleanup/IP updates, and request/session protection around AI calls.
- AI provider layer: generation and edit routes now call a provider abstraction (`src/lib/ai`) that can be swapped to Gemini, Claude, OpenAI, or DeepSeek later without rewriting route logic.
- Daily credit system: Qorvex now tracks prompt tokens, completion tokens, total tokens, estimated API cost, request counts, and active AI sessions in `daily_ai_usage` rows keyed by UTC date instead of limiting users by project count or weekly generation counters.
- AI: `/api/generate` now uses a staged pipeline instead of one giant completion. Stage 1 creates a compact app plan, Stage 2 expands screen specs, Stage 3 builds the file manifest, Stage 4 assembles project files in batches, and Stage 5 prepares preview metadata before persisting the project.
- Token strategy: prompt text is compacted and deduplicated, features are capped and normalized, large requests show a staged-generation notice, model calls are JSON-first with low temperature, AI stages estimate budget before running, and code is no longer requested in a single oversized response.
- Recovery: each AI-backed stage retries once, stage calls are timeout-bounded, later-stage failures preserve completed work, and the route can return a partial project payload with warnings instead of dropping the entire generation.
- Preview metadata: generated projects now persist hidden structured preview metadata alongside files so the detail page preview can render app-specific screens instead of a generic mock.
- Editor metadata: project files now also persist hidden chat-history metadata so the Editor tab can restore previous edit conversations after reload without exposing that metadata in the code tree or downloads.
- Billing: Stripe checkout/portal/webhook routes are implemented, but Stripe environment values are currently empty.
- Manual payment uploads: the client modal now posts once to `/api/manual-payments`, the server validates MIME/size, optimizes image uploads with `sharp`, writes screenshots into the private `payment-screenshots` bucket using the authenticated Supabase server client, maps bucket/RLS/size/timeout errors into safe JSON, and always returns a user-safe error message instead of surfacing a raw runtime error.
- Manual payment submit flow: `/api/manual-payments` is now excluded from the global Supabase proxy matcher so multipart uploads do not pass through auth middleware, the route verifies auth once and then uses the service-role admin client for storage/database writes, ensures the `user_profiles` row exists before inserting into `manual_payments`, returns `{ success, paymentId, error }` JSON, and wraps cleanup in its own timeout so a failed insert can never leave the client waiting forever.
- GitHub integration: `/api/github/connect` now starts OAuth with `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `NEXT_PUBLIC_APP_URL`; `/api/github/callback` exchanges the code server-side and stores the token with the service-role client; `/api/github/status`, `/api/github/repos`, `/api/github/repos/create`, and `/api/projects/[id]/export/github` keep the access token server-only while letting the client connect, create/select repos, and export generated Expo files.
- GitHub export pipeline: Qorvex exports only generated project files plus a synthesized `README.md` and `.gitignore`, validates repository ownership against the connected GitHub username, supports empty or existing repos by creating/updating a commit tree on the selected branch, updates `projects.github_repo`, and records export metadata in `deployments` plus `github_exports` when that table exists.

## Health check results

- `npm run build`: passing (verified 2026-05-18 after Dialog/Settings rewrite).
- `npm run lint`: passing (verified 2026-05-18 after Dialog/Settings rewrite).
- `npm run dev`: app starts. An existing dev server was already listening on `localhost:3000`; the app returned HTTP 200.
- `/api/auth/signout`: verified on the running dev server. POST returns `{"success":true}` and the client now redirects to `/login` after the server clears auth cookies.
- `/api/projects/delete-error-projects`: verified on the running dev server. Unauthenticated requests now return clear JSON `{"success":false,"error":"Unauthorized"}` instead of hanging.
- `/api/projects/[id]`: verified on the running dev server. Unauthenticated `DELETE` requests now return clear JSON `{"success":false,"error":"Unauthorized"}` instead of hanging.
- `/api/projects/[id]/download`: implemented for generated project export. Unauthenticated access is blocked server-side; authenticated users receive a downloadable JSON export of real generated files.
- `/api/generate`: route is reachable and correctly returns HTTP 401 without an authenticated session. A true end-to-end authenticated generation run was not executed because it would require a real/test user session and would create Supabase rows plus call the configured Anthropic backend.
- `/api/usage`: implemented. Authenticated users can now fetch their current daily AI credit snapshot, remaining balance, estimated cost, and UTC reset time for frontend indicators.
- `/api/manual-payments`: implemented. Manual payment submission now goes through an authenticated server route with a 60 second screenshot upload timeout, server-side image optimization, friendly validation errors, and guaranteed loading-state cleanup in the modal client.
- Manual payment client flow: the billing modal now logs submit state in the browser console, aborts the request after 65 seconds, shows readable failure toasts, refreshes `/billing` on success so the pending-payment banner appears immediately, closes the modal, and always clears the `Submitting...` state in `finally`.
- GitHub routes: build-verified routes now include `/api/github/connect`, `/api/github/callback`, `/api/github/status`, `/api/github/repos`, `/api/github/repos/create`, and `/api/projects/[id]/export/github`.
- Supabase client usage: checked. Client components/hooks/services use the browser client; server components and API routes use the server client or service-role admin client.
- RLS policies in `supabase/schema.sql`: checked for `projects`, `generations`, `user_profiles`, and `subscriptions`.
- Delete stability: `Delete Project` and `Delete All Error Projects` now go through authenticated server routes and always clear loading state in the client.
- Project card menu: the three-dot actions menu now uses a portal-backed Radix dropdown so it renders above card containers instead of being clipped inside them.
- Project card delete: the dropdown now closes before the confirmation modal opens, the modal renders through a portal-backed shadcn `Dialog` at `z-[200]` above any card transform, Cancel and the close button both dismiss the modal, the dialog can no longer be dismissed mid-delete, and Delete always resets its loading state, refreshes the list, and toasts on success or failure.
- Settings Profile: the profile tab now loads the authenticated Supabase user, displays the auth email read-only, loads or upserts the matching `user_profiles` row, lets the user edit full name and preferred language, and saves through a single `upsert` that returns the canonical row so the inputs and store stay in sync. Errors surface the underlying Supabase message, the Save button never stays disabled after success or failure, and the success toast confirms persistence.
- Settings Profile inputs: the Full name input and Preferred language select are no longer gated by a `disabled={loading}` flag and the parent no longer remounts the tab on store-user changes, so typing and dropdown selection work even before the initial fetch resolves; a `userDirtyRef` keeps the async load from clobbering values the user has already begun editing, and the dirty flag clears on a successful save so future loads can refresh the inputs.
- Settings auth source: `/settings/page.tsx` is now a server component that authenticates with the same server Supabase client used by `/dashboard` and `/projects`. It redirects to `/login` if unauthenticated, otherwise fetches the `user_profiles` row server-side and hands `email` and `initialProfile` to a new `SettingsClient` component. The client UI no longer races a client-side `auth.getUser()` call before allowing edits, and the false "You are not signed in" toast is gone.
- Settings profile save: profile saves now go through `POST /api/settings/profile`, a server route that re-authenticates via the request cookies, validates `preferred_language` against the supported list, sanitizes `full_name`, and upserts `user_profiles` with the service-role admin client so RLS can never silently stall the request. The client `save()` wraps the fetch in `withTimeout(15s)` and always resets `saving` in `finally`, so the button never gets stuck on "Saving..." — either it completes and toasts success, or it surfaces the readable server error message.
- Settings preferred_language persistence: the API route now hard-rejects requests with a missing or unsupported `preferred_language` (returns HTTP 400 with the received value) instead of silently coercing to `"en"`, the client save handler calls `router.refresh()` after a successful response so the server component re-reads the row, and both the client (`[settings] saving payload:` / `[settings] save response profile:`) and server (`[api/settings/profile] received body:` / `writing preferred_language:` / `upsert returned:` / `[settings/page] loaded preferred_language:`) emit diagnostic logs so a regression can be traced end-to-end. Page is `dynamic = "force-dynamic"` so the read on refresh never serves a cached row.
- Sign out stability: the client now calls `/api/auth/signout`, clears browser-side Supabase state, and redirects to `/login` without waiting forever on client-side auth.
- Project detail UX: deploy actions are no longer dead, download export works through a server route, the App Store checklist opens in a modal, and GitHub export now shows an explicit coming-soon explanation instead of pretending to connect.
- Editor and versions: the Project Detail Editor tab now opens with a summary assistant message, keeps a sticky bottom composer, restores saved edit history from hidden project metadata, persists AI edits back into `projects.generated_code`, appends generation history rows, and creates `app_versions` snapshots so the Versions tab can reflect new edits after refresh.
- Preview quality: generation prompts now request structured app metadata, multiple screens, realistic sections, sample data, and reusable components; the mobile preview renderer uses that structure and falls back to app-specific inferred layouts for older projects.
- Large-app resilience: generation no longer depends on streaming a full Expo codebase from the model. The server now streams progress events for planning, screen generation, navigation, components, preview, and finalization while assembling files from staged structured output.
- Credit-aware protection: AI routes now guard against overlapping requests, rapid-fire abuse, and low remaining credits before expensive stages run. Generation and edit flows also record provider/model usage metadata back into `generations`.

## RLS policy status

- `user_profiles`: RLS enabled. Users can select and update their own profile by `auth.uid() = id`.
- `projects`: RLS enabled. Users can select, insert, update, and delete their own projects by `auth.uid() = user_id`.
- `generations`: RLS enabled. Users can select and insert their own generations by `auth.uid() = user_id`. Updates are performed through the server admin client.
- `daily_ai_usage`: RLS enabled in schema and migration. Users can select their own daily usage rows by `auth.uid() = user_id`; writes are handled server-side.
- `subscriptions`: RLS enabled. Users can select their own subscription by `auth.uid() = user_id`. Inserts/updates are performed through Stripe webhook/admin server logic.
- `payment-screenshots` bucket: upload paths are `auth.uid()/orderId/timestamp-filename.ext`. The required private-bucket insert policy is in `supabase/migration_manual_payments.sql`; service-role admin reads continue to bypass RLS through the server-side screenshot route.
- `github_connections`: schema and migration now remove direct user `select` access so GitHub access tokens stay server-only. Apply `supabase/migration_github_export.sql` remotely to enforce that live.
- `github_exports`: optional export metadata table added in schema/migration so GitHub repo URL, branch, and commit SHA can be persisted per export without polluting app version history.

## Remaining bugs / risks

- Full authenticated `/api/generate` verification still needs a test account/session or explicit approval to create one.
- The new `daily_ai_usage` table and generation token columns require the SQL migration (`supabase/migration_daily_ai_credits.sql`) to be applied in the remote Supabase project before production rollout.
- The GitHub rollout needs `supabase/migration_github_export.sql` applied remotely so `github_connections` no longer exposes tokens via old `select` policies and `github_exports` can persist export metadata.
- The current staged code generator uses a deterministic Expo template driven by AI-produced plan/screen specs. It is much more reliable for large prompts, but future quality work should keep enriching the generated component library and screen templates.
- Project edit chat currently uses compact project context plus targeted file snippets instead of the full codebase. This is more reliable for everyday edits, but very large cross-cutting refactors may still need a broader file-selection strategy later.
- Browser click-through verification for authenticated project detail editing, download export, deploy modals, and live preview switching still needs a real interactive session. The route-level and build-level checks are complete.
- Browser click-through verification for the project card Delete dialog (open menu → Delete → Cancel/Delete) and the /settings Profile save round-trip (full name + language persists across refresh) still needs a real signed-in session. The component, build, and lint level checks are complete.
- Stripe checkout/portal/webhook cannot fully work until Stripe environment variables are configured.
- GitHub OAuth/push cannot fully work until GitHub environment variables are configured.
- A full GitHub connect/create/export/re-export smoke test still needs a real signed-in browser session plus valid GitHub OAuth credentials; lint/build and route wiring are complete.
- `supabase/schema.sql` has been inspected locally, but live Supabase policy drift has not been checked against the remote database.
- Some source files contain mojibake text from previous encoding issues; it does not currently block build/lint, but user-facing copy should be cleaned in a focused pass.

## Next module tasks

- Create a safe test account workflow or seed-only local Supabase path for repeatable authenticated `/api/generate` smoke tests.
- Apply `supabase/migration_daily_ai_credits.sql` remotely and verify the new daily usage rows, generation token columns, and RLS policy behavior against the live database.
- Add a server-side usage summary card to billing so the new daily AI credit metrics are visible there even before client hydration.
- Expand the staged file generator with more domain-specific components so finance, fitness, restaurant, commerce, and travel apps diverge even further in their generated code.
- Add a dedicated project-edit route alias if we later want `/api/projects/[id]/chat` semantics without changing the current working `/api/generate/chat` flow.
- Add telemetry around per-stage duration, fallback frequency, and partial-generation recovery so large-app failures can be measured instead of inferred.
- Run an authenticated browser smoke test for project detail editing, download export, deploy modals, and logout after the next login session is available.
- Configure Stripe test-mode values and verify checkout, portal, and webhook flows.
- Configure GitHub OAuth values and verify connect/push flows.
- Apply `supabase/migration_github_export.sql` remotely and verify the tightened `github_connections` RLS behavior against the live database.
- Add lightweight integration tests for auth redirects, server-backed project deletion/export, and generation/chat API unauthorized/authorized paths.
- Clean mojibake copy in UI strings and prompts before adding new features.
