import { getAIProvider, type AIUsage } from "@/lib/ai";
import { withTimeout } from "@/lib/with-timeout";
import {
  type ProjectPreviewModel,
  type ProjectPreviewScreen,
  type ProjectPreviewSection,
  withProjectPreviewFile,
} from "@/lib/project-artifacts";
import type { ProjectColors } from "@/types";

export interface GenerationPipelineInput {
  prompt: string;
  projectName: string;
  templateId?: string | null;
  colors: ProjectColors;
  features: string[];
  platform: "ios" | "android" | "both";
}

export interface GenerationPipelineEvent {
  stage: string;
  percent: number;
  message: string;
}

export interface GenerationPipelineResult {
  files: Record<string, string>;
  preview: ProjectPreviewModel;
  partial: boolean;
  warnings: string[];
  usage: AIUsage[];
}

interface AppPlan {
  appName: string;
  description: string;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  navigation: {
    type: "tabs" | "stack" | "mixed";
    tabs: string[];
  };
  screens: Array<{
    id: string;
    title: string;
    purpose: string;
    route: string;
    tabLabel: string;
    icon: string;
  }>;
  features: string[];
  entities: string[];
  sampleData: Record<string, unknown>;
  architecture: {
    routing: string;
    styling: string;
    backend: string;
    state: string;
  };
}

interface ScreenSpec {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  tabLabel: string;
  icon: string;
  sections: ProjectPreviewSection[];
  primaryActions: string[];
  emptyState: {
    title: string;
    body: string;
    cta: string;
  };
  loadingState: {
    title: string;
    body: string;
  };
}

interface FileManifestEntry {
  path: string;
  kind: "config" | "layout" | "lib" | "component" | "screen";
  purpose: string;
  screenId?: string;
}

const STAGE_MESSAGE =
  "Generating a larger app may take longer. Qorvex is optimizing the project architecture in stages.";

const MAX_PROMPT_CHARS = 2200;
const MAX_FEATURES = 12;
const MAX_ENTITY_COUNT = 8;
const MAX_SCREEN_COUNT = 6;
const MAX_TABS = 5;
const DEFAULT_APP_BACKGROUND = "#05070f";

function stringArraySchema(minItems = 0, maxItems = 12) {
  return {
    type: "array",
    items: { type: "string" },
    minItems,
    maxItems,
  };
}

function screenSectionSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      type: {
        type: "string",
        enum: ["hero", "stats", "list", "chart", "actions", "empty"],
      },
      title: { type: "string" },
      body: { type: "string" },
      value: { type: "string" },
      cta: { type: "string" },
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: true,
          properties: {
            label: { type: "string" },
            value: {
              type: ["string", "number"],
            },
          },
        },
      },
    },
    required: ["type", "title"],
  };
}

function appPlanSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      appName: { type: "string" },
      description: { type: "string" },
      theme: {
        type: "object",
        additionalProperties: false,
        properties: {
          primary: { type: "string" },
          secondary: { type: "string" },
          accent: { type: "string" },
          background: { type: "string" },
        },
        required: ["primary", "secondary", "accent", "background"],
      },
      navigation: {
        type: "object",
        additionalProperties: false,
        properties: {
          type: {
            type: "string",
            enum: ["tabs", "stack", "mixed"],
          },
          tabs: stringArraySchema(2, MAX_TABS),
        },
        required: ["type", "tabs"],
      },
      screens: {
        type: "array",
        minItems: 4,
        maxItems: MAX_SCREEN_COUNT,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            purpose: { type: "string" },
            route: { type: "string" },
            tabLabel: { type: "string" },
            icon: { type: "string" },
          },
          required: ["id", "title", "purpose", "route", "tabLabel", "icon"],
        },
      },
      features: stringArraySchema(3, MAX_FEATURES),
      entities: stringArraySchema(2, MAX_ENTITY_COUNT),
      sampleData: {
        type: "object",
        additionalProperties: true,
      },
      architecture: {
        type: "object",
        additionalProperties: false,
        properties: {
          routing: { type: "string" },
          styling: { type: "string" },
          backend: { type: "string" },
          state: { type: "string" },
        },
        required: ["routing", "styling", "backend", "state"],
      },
    },
    required: [
      "appName",
      "description",
      "theme",
      "navigation",
      "screens",
      "features",
      "entities",
      "sampleData",
      "architecture",
    ],
  };
}

function screenSpecsSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      screens: {
        type: "array",
        minItems: 4,
        maxItems: MAX_SCREEN_COUNT,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            subtitle: { type: "string" },
            route: { type: "string" },
            tabLabel: { type: "string" },
            icon: { type: "string" },
            primaryActions: stringArraySchema(2, 5),
            loadingState: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                body: { type: "string" },
              },
              required: ["title", "body"],
            },
            emptyState: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                body: { type: "string" },
                cta: { type: "string" },
              },
              required: ["title", "body", "cta"],
            },
            sections: {
              type: "array",
              minItems: 3,
              maxItems: 5,
              items: screenSectionSchema(),
            },
          },
          required: [
            "id",
            "title",
            "subtitle",
            "route",
            "tabLabel",
            "icon",
            "primaryActions",
            "loadingState",
            "emptyState",
            "sections",
          ],
        },
      },
    },
    required: ["screens"],
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toTitleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = compactWhitespace(value);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function sanitizePrompt(prompt: string) {
  const sentences = compactWhitespace(prompt)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const uniqueSentences = uniqueStrings(sentences);
  const joined = uniqueSentences.join(" ");
  if (joined.length <= MAX_PROMPT_CHARS) {
    return joined;
  }

  return `${joined.slice(0, MAX_PROMPT_CHARS - 3).trim()}...`;
}

function sanitizeFeatures(features: string[]) {
  return uniqueStrings(features).slice(0, MAX_FEATURES);
}

function isLargeRequest(input: GenerationPipelineInput) {
  return (
    input.prompt.length > 900 ||
    input.features.length > 6 ||
    compactWhitespace(input.prompt).split(" ").length > 140
  );
}

function inferDomain(text: string) {
  const lower = text.toLowerCase();

  if (/finance|budget|expense|bank|investment|wallet|crypto/.test(lower)) {
    return "finance";
  }
  if (/fitness|workout|gym|health|meal|nutrition|running/.test(lower)) {
    return "fitness";
  }
  if (/restaurant|booking|reservation|table|dining|food/.test(lower)) {
    return "restaurant";
  }
  if (/shop|store|ecommerce|cart|checkout|product|retail/.test(lower)) {
    return "commerce";
  }
  if (/travel|trip|itinerary|hotel|flight|vacation/.test(lower)) {
    return "travel";
  }
  if (/social|community|chat|feed|creator|network/.test(lower)) {
    return "social";
  }

  return "generic";
}

function pickIcons(domain: string) {
  switch (domain) {
    case "finance":
      return ["wallet-outline", "list-outline", "bar-chart-outline", "pie-chart-outline", "person-outline", "settings-outline"];
    case "fitness":
      return ["flash-outline", "barbell-outline", "stats-chart-outline", "calendar-outline", "person-outline", "settings-outline"];
    case "restaurant":
      return ["restaurant-outline", "search-outline", "calendar-outline", "bookmark-outline", "person-outline", "settings-outline"];
    case "commerce":
      return ["home-outline", "search-outline", "cart-outline", "receipt-outline", "person-outline", "settings-outline"];
    case "travel":
      return ["airplane-outline", "compass-outline", "calendar-outline", "map-outline", "person-outline", "settings-outline"];
    case "social":
      return ["home-outline", "chatbubble-outline", "people-outline", "sparkles-outline", "person-outline", "settings-outline"];
    default:
      return ["home-outline", "grid-outline", "stats-chart-outline", "notifications-outline", "person-outline", "settings-outline"];
  }
}

function defaultScreensForDomain(domain: string) {
  switch (domain) {
    case "finance":
      return [
        ["overview", "Overview", "Track balances, budgets, and spending health."],
        ["transactions", "Transactions", "Review income, expenses, and recurring activity."],
        ["budgets", "Budgets", "Monitor category budgets and monthly targets."],
        ["insights", "Insights", "Understand trends, categories, and recommendations."],
        ["profile", "Profile", "Manage linked accounts, alerts, and preferences."],
      ];
    case "fitness":
      return [
        ["dashboard", "Dashboard", "See workouts, streaks, and weekly momentum."],
        ["workouts", "Workouts", "Browse plans, training blocks, and exercise detail."],
        ["progress", "Progress", "Track goals, body metrics, and consistency."],
        ["schedule", "Schedule", "Plan sessions, recovery, and reminders."],
        ["profile", "Profile", "Manage goals, health preferences, and coaching settings."],
      ];
    case "restaurant":
      return [
        ["discover", "Discover", "Explore restaurants, trends, and nearby options."],
        ["bookings", "Bookings", "Manage upcoming reservations and waitlists."],
        ["favorites", "Favorites", "Save venues, cuisines, and repeat bookings."],
        ["offers", "Offers", "Browse tasting menus, events, and promotions."],
        ["profile", "Profile", "Manage diners, preferences, and account details."],
      ];
    case "commerce":
      return [
        ["home", "Home", "Showcase featured products and collections."],
        ["browse", "Browse", "Explore categories, filters, and recommendations."],
        ["cart", "Cart", "Review saved items and checkout details."],
        ["orders", "Orders", "Track deliveries, returns, and purchases."],
        ["profile", "Profile", "Manage addresses, payments, and preferences."],
      ];
    case "travel":
      return [
        ["overview", "Overview", "Highlight trips, inspiration, and booking status."],
        ["explore", "Explore", "Browse destinations, deals, and recommendations."],
        ["itinerary", "Itinerary", "Manage bookings, activities, and day plans."],
        ["saved", "Saved", "Keep hotels, attractions, and wish lists together."],
        ["profile", "Profile", "Manage travelers, passports, and alerts."],
      ];
    case "social":
      return [
        ["feed", "Feed", "See updates, creators, and trending content."],
        ["messages", "Messages", "Chat with friends, collaborators, or customers."],
        ["community", "Community", "Join groups, events, and social spaces."],
        ["discover", "Discover", "Find people, posts, and recommendations."],
        ["profile", "Profile", "Manage your identity, preferences, and privacy."],
      ];
    default:
      return [
        ["home", "Home", "See the main dashboard, actions, and recent activity."],
        ["workspace", "Workspace", "Manage the app's central workflow and data."],
        ["insights", "Insights", "Review analytics, trends, and performance."],
        ["updates", "Updates", "Track notifications, tasks, and system status."],
        ["profile", "Profile", "Adjust settings, team info, and account details."],
      ];
  }
}

function buildFallbackPlan(input: GenerationPipelineInput): AppPlan {
  const prompt = sanitizePrompt(input.prompt);
  const domain = inferDomain(`${input.projectName} ${prompt}`);
  const icons = pickIcons(domain);
  const screens = defaultScreensForDomain(domain)
    .slice(0, MAX_SCREEN_COUNT)
    .map(([id, title, purpose], index) => ({
      id,
      title,
      purpose,
      route: index === 0 ? "index" : slugify(id),
      tabLabel: title,
      icon: icons[index] ?? "ellipse-outline",
    }));

  const features = sanitizeFeatures(input.features);
  const entities = uniqueStrings(
    [
      domain === "finance" ? "accounts" : "",
      domain === "fitness" ? "workouts" : "",
      domain === "restaurant" ? "reservations" : "",
      domain === "commerce" ? "products" : "",
      domain === "travel" ? "trips" : "",
      domain === "social" ? "posts" : "",
      "users",
      "tasks",
      "notifications",
    ].filter(Boolean),
  ).slice(0, MAX_ENTITY_COUNT);

  return {
    appName: input.projectName,
    description: prompt,
    theme: {
      primary: input.colors.primary,
      secondary: input.colors.secondary,
      accent: input.colors.accent,
      background: DEFAULT_APP_BACKGROUND,
    },
    navigation: {
      type: "tabs",
      tabs: screens.slice(0, MAX_TABS).map((screen) => screen.tabLabel),
    },
    screens,
    features,
    entities,
    sampleData: {
      domain,
      featuredMetrics:
        domain === "finance"
          ? ["Monthly spend", "Budget health", "Savings rate"]
          : domain === "fitness"
            ? ["Weekly workouts", "Recovery score", "Calories burned"]
            : domain === "restaurant"
              ? ["Open tables", "Popular venues", "Upcoming reservations"]
              : ["Active items", "Recent activity", "Recommended actions"],
    },
    architecture: {
      routing: "expo-router tabs with typed screen metadata",
      styling: "NativeWind utility classes plus shared theme tokens",
      backend: "Supabase auth, profile data, and app entities",
      state: "local screen config with lightweight app metadata",
    },
  };
}

function tryParseJson<T>(raw: string): T | null {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const direct = [cleaned];
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) {
    direct.push(cleaned.slice(start, end + 1));
  }

  for (const candidate of direct) {
    try {
      return JSON.parse(candidate) as T;
    } catch {}
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizePlan(value: unknown, fallback: AppPlan): AppPlan {
  if (!isRecord(value)) return fallback;

  const screens = Array.isArray(value.screens)
    ? value.screens
        .map((screen, index) => {
          if (!isRecord(screen) || typeof screen.title !== "string") return null;
          const title = screen.title.trim();
          if (!title) return null;

          const id =
            typeof screen.id === "string" && screen.id.trim()
              ? slugify(screen.id)
              : slugify(title);

          return {
            id,
            title,
            purpose:
              typeof screen.purpose === "string" && screen.purpose.trim()
                ? screen.purpose.trim()
                : fallback.screens[index]?.purpose ?? `Explore ${title}.`,
            route:
              index === 0
                ? "index"
                : typeof screen.route === "string" && screen.route.trim()
                  ? slugify(screen.route)
                  : slugify(id),
            tabLabel:
              typeof screen.tabLabel === "string" && screen.tabLabel.trim()
                ? screen.tabLabel.trim()
                : title,
            icon:
              typeof screen.icon === "string" && screen.icon.trim()
                ? screen.icon.trim()
                : fallback.screens[index]?.icon ?? "ellipse-outline",
          };
        })
        .filter((screen): screen is AppPlan["screens"][number] => Boolean(screen))
        .slice(0, MAX_SCREEN_COUNT)
    : fallback.screens;

  return {
    appName:
      typeof value.appName === "string" && value.appName.trim()
        ? value.appName.trim()
        : fallback.appName,
    description:
      typeof value.description === "string" && value.description.trim()
        ? value.description.trim()
        : fallback.description,
    theme: {
      primary:
        typeof value.theme === "object" &&
        value.theme !== null &&
        typeof (value.theme as Record<string, unknown>).primary === "string"
          ? String((value.theme as Record<string, unknown>).primary)
          : fallback.theme.primary,
      secondary:
        typeof value.theme === "object" &&
        value.theme !== null &&
        typeof (value.theme as Record<string, unknown>).secondary === "string"
          ? String((value.theme as Record<string, unknown>).secondary)
          : fallback.theme.secondary,
      accent:
        typeof value.theme === "object" &&
        value.theme !== null &&
        typeof (value.theme as Record<string, unknown>).accent === "string"
          ? String((value.theme as Record<string, unknown>).accent)
          : fallback.theme.accent,
      // Force a dark app canvas by default so generated white text and light
      // cards stay readable on the very first generation.
      background: fallback.theme.background,
    },
    navigation: {
      type:
        typeof value.navigation === "object" &&
        value.navigation !== null &&
        ["tabs", "stack", "mixed"].includes(
          String((value.navigation as Record<string, unknown>).type),
        )
          ? ((value.navigation as Record<string, unknown>).type as "tabs" | "stack" | "mixed")
          : fallback.navigation.type,
      tabs:
        typeof value.navigation === "object" &&
        value.navigation !== null &&
        Array.isArray((value.navigation as Record<string, unknown>).tabs)
          ? ((value.navigation as Record<string, unknown>).tabs as unknown[])
              .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
              .slice(0, MAX_TABS)
          : fallback.navigation.tabs,
    },
    screens: screens.length > 0 ? screens : fallback.screens,
    features:
      Array.isArray(value.features)
        ? sanitizeFeatures(
            (value.features as unknown[]).filter(
              (item): item is string => typeof item === "string",
            ),
          )
        : fallback.features,
    entities:
      Array.isArray(value.entities)
        ? uniqueStrings(
            (value.entities as unknown[]).filter(
              (item): item is string => typeof item === "string",
            ),
          ).slice(0, MAX_ENTITY_COUNT)
        : fallback.entities,
    sampleData: isRecord(value.sampleData) ? value.sampleData : fallback.sampleData,
    architecture: {
      routing:
        isRecord(value.architecture) &&
        typeof value.architecture.routing === "string"
          ? value.architecture.routing
          : fallback.architecture.routing,
      styling:
        isRecord(value.architecture) &&
        typeof value.architecture.styling === "string"
          ? value.architecture.styling
          : fallback.architecture.styling,
      backend:
        isRecord(value.architecture) &&
        typeof value.architecture.backend === "string"
          ? value.architecture.backend
          : fallback.architecture.backend,
      state:
        isRecord(value.architecture) &&
        typeof value.architecture.state === "string"
          ? value.architecture.state
          : fallback.architecture.state,
    },
  };
}

function buildSectionsFromDomain(
  domain: string,
  title: string,
  purpose: string,
): ProjectPreviewSection[] {
  if (domain === "finance") {
    return [
      {
        type: "hero",
        title,
        body: purpose,
        value: "$24,860",
        cta: "Review plan",
        items: [
          { label: "Cash flow", value: "+12%" },
          { label: "Budget status", value: "On track" },
        ],
      },
      {
        type: "stats",
        title: "Key metrics",
        items: [
          { label: "Food", value: "$480" },
          { label: "Transport", value: "$220" },
          { label: "Savings", value: "$1,240" },
        ],
      },
      {
        type: "list",
        title: "Recent transactions",
        items: [
          { label: "Salary", value: "+$4,800" },
          { label: "Coffee Roasters", value: "-$18" },
          { label: "Streaming", value: "-$12" },
        ],
      },
    ];
  }

  if (domain === "fitness") {
    return [
      {
        type: "hero",
        title,
        body: purpose,
        value: "5 workouts",
        cta: "Start session",
        items: [
          { label: "Goal", value: "4 / week" },
          { label: "Recovery", value: "82%" },
        ],
      },
      {
        type: "stats",
        title: "Performance",
        items: [
          { label: "Calories", value: "2,140" },
          { label: "Volume", value: "12.8k kg" },
          { label: "Sleep", value: "7.4h" },
        ],
      },
      {
        type: "list",
        title: "Recommended actions",
        items: [
          { label: "Upper-body strength", value: "45 min" },
          { label: "Mobility routine", value: "12 min" },
          { label: "Hydration check", value: "1.8L" },
        ],
      },
    ];
  }

  if (domain === "restaurant") {
    return [
      {
        type: "hero",
        title,
        body: purpose,
        value: "18 tables",
        cta: "Reserve now",
        items: [
          { label: "Tonight", value: "6 openings" },
          { label: "Top cuisine", value: "Modern Italian" },
        ],
      },
      {
        type: "list",
        title: "Popular venues",
        items: [
          { label: "Sora Rooftop", value: "4.9 rating" },
          { label: "Marina Table", value: "Waterfront" },
          { label: "Cedar Flame", value: "Chef's menu" },
        ],
      },
      {
        type: "actions",
        title: "Reservation actions",
        items: [
          { label: "Join waitlist", value: "2 min" },
          { label: "Call venue", value: "Instant" },
          { label: "Share with group", value: "3 diners" },
        ],
      },
    ];
  }

  return [
    {
      type: "hero",
      title,
      body: purpose,
      value: "Live",
      cta: "Open flow",
      items: [
        { label: "Priority", value: "High" },
        { label: "Status", value: "Ready" },
      ],
    },
    {
      type: "stats",
      title: "Overview",
      items: [
        { label: "Tasks", value: "12" },
        { label: "Updated", value: "Today" },
        { label: "Coverage", value: "86%" },
      ],
    },
    {
      type: "list",
      title: "Recent activity",
      items: [
        { label: "Workflow synced", value: "2 min ago" },
        { label: "Insight created", value: "Today" },
        { label: "Reminder scheduled", value: "Tomorrow" },
      ],
    },
  ];
}

function fallbackScreenSpecs(plan: AppPlan): ScreenSpec[] {
  const domain = inferDomain(`${plan.appName} ${plan.description}`);

  return plan.screens.map((screen, index) => ({
    id: screen.id,
    title: screen.title,
    subtitle: screen.purpose,
    route: screen.route,
    tabLabel: screen.tabLabel,
    icon: screen.icon,
    sections: [
      ...buildSectionsFromDomain(domain, screen.title, screen.purpose),
      index % 2 === 0
        ? {
            type: "chart",
            title: `${screen.title} trends`,
            body: `Track movement and changes across ${screen.title.toLowerCase()}.`,
            items: [
              { label: "This week", value: 78 },
              { label: "Last week", value: 64 },
              { label: "Goal", value: 90 },
            ],
          }
        : {
            type: "empty",
            title: `Nothing blocked in ${screen.title.toLowerCase()}`,
            body: "The experience includes a clear empty state for fresh accounts and new users.",
            cta: "Create first item",
          },
    ],
    primaryActions: ["Add new", "Share", "View details"],
    emptyState: {
      title: `No ${screen.title.toLowerCase()} yet`,
      body: `Start building out ${screen.title.toLowerCase()} content with a clear first action.`,
      cta: "Get started",
    },
    loadingState: {
      title: `Loading ${screen.title.toLowerCase()}`,
      body: "The app shows meaningful skeleton and loading messaging before data arrives.",
    },
  }));
}

function normalizeScreenSpecs(value: unknown, fallback: ScreenSpec[]): ScreenSpec[] {
  if (!isRecord(value) || !Array.isArray(value.screens)) {
    return fallback;
  }

  const screens = value.screens
    .map((screen, index) => {
      if (!isRecord(screen) || typeof screen.title !== "string") return null;
      const base = fallback[index] ?? fallback[0];
      if (!base) return null;

      const sections = Array.isArray(screen.sections)
        ? screen.sections
            .map((section): ProjectPreviewSection | null => {
              if (!isRecord(section) || typeof section.title !== "string") return null;
              const type =
                section.type === "hero" ||
                section.type === "stats" ||
                section.type === "list" ||
                section.type === "chart" ||
                section.type === "actions" ||
                section.type === "empty"
                  ? section.type
                  : "list";
              return {
                type,
                title: section.title,
                body: typeof section.body === "string" ? section.body : undefined,
                value:
                  typeof section.value === "string"
                    ? section.value
                    : typeof section.value === "number"
                      ? String(section.value)
                      : undefined,
                cta: typeof section.cta === "string" ? section.cta : undefined,
                items: Array.isArray(section.items)
                  ? section.items.filter(
                      (item): item is Record<string, string | number> =>
                        isRecord(item),
                    )
                  : undefined,
              };
            })
            .filter((section): section is ProjectPreviewSection => Boolean(section))
        : base.sections;

      return {
        ...base,
        id:
          typeof screen.id === "string" && screen.id.trim()
            ? slugify(screen.id)
            : base.id,
        title: screen.title.trim() || base.title,
        subtitle:
          typeof screen.subtitle === "string" && screen.subtitle.trim()
            ? screen.subtitle.trim()
            : base.subtitle,
        route:
          typeof screen.route === "string" && screen.route.trim()
            ? index === 0
              ? "index"
              : slugify(screen.route)
            : base.route,
        tabLabel:
          typeof screen.tabLabel === "string" && screen.tabLabel.trim()
            ? screen.tabLabel.trim()
            : base.tabLabel,
        icon:
          typeof screen.icon === "string" && screen.icon.trim()
            ? screen.icon.trim()
            : base.icon,
        sections: sections.length > 0 ? sections : base.sections,
        primaryActions:
          Array.isArray(screen.primaryActions) && screen.primaryActions.length > 0
            ? screen.primaryActions.filter(
                (action): action is string =>
                  typeof action === "string" && action.trim().length > 0,
              )
            : base.primaryActions,
        emptyState:
          isRecord(screen.emptyState) &&
          typeof screen.emptyState.title === "string" &&
          typeof screen.emptyState.body === "string" &&
          typeof screen.emptyState.cta === "string"
            ? {
                title: screen.emptyState.title,
                body: screen.emptyState.body,
                cta: screen.emptyState.cta,
              }
            : base.emptyState,
        loadingState:
          isRecord(screen.loadingState) &&
          typeof screen.loadingState.title === "string" &&
          typeof screen.loadingState.body === "string"
            ? {
                title: screen.loadingState.title,
                body: screen.loadingState.body,
              }
            : base.loadingState,
      } satisfies ScreenSpec;
    })
    .filter((screen): screen is ScreenSpec => Boolean(screen));

  return screens.length > 0 ? screens.slice(0, MAX_SCREEN_COUNT) : fallback;
}

function buildFileManifest(screens: ScreenSpec[]): FileManifestEntry[] {
  const manifest: FileManifestEntry[] = [
    { path: "app.json", kind: "config", purpose: "Expo app metadata" },
    { path: "package.json", kind: "config", purpose: "Project dependencies and scripts" },
    { path: "tsconfig.json", kind: "config", purpose: "TypeScript configuration" },
    { path: "app/_layout.tsx", kind: "layout", purpose: "Root stack layout" },
    { path: "app/(tabs)/_layout.tsx", kind: "layout", purpose: "Tab navigation layout" },
    { path: "components/app-shell/AppShellHeader.tsx", kind: "component", purpose: "Premium screen header" },
    { path: "components/app-shell/ScreenRenderer.tsx", kind: "component", purpose: "Data-driven screen renderer" },
    { path: "components/app-shell/SectionBlock.tsx", kind: "component", purpose: "Reusable preview section renderer" },
    { path: "components/app-shell/SectionListRow.tsx", kind: "component", purpose: "Reusable list row" },
    { path: "components/app-shell/StatPill.tsx", kind: "component", purpose: "Small metric component" },
    { path: "lib/app-plan.ts", kind: "lib", purpose: "Structured app plan and screen metadata" },
    { path: "lib/theme.ts", kind: "lib", purpose: "Theme tokens for the generated app" },
    { path: "lib/supabase.ts", kind: "lib", purpose: "Supabase browser client helper" },
  ];

  screens.forEach((screen, index) => {
    manifest.push({
      path:
        index === 0
          ? "app/(tabs)/index.tsx"
          : `app/(tabs)/${screen.route}.tsx`,
      kind: "screen",
      purpose: `${screen.title} screen route`,
      screenId: screen.id,
    });
  });

  return manifest;
}

function toConstJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function buildAppJson(plan: AppPlan) {
  return JSON.stringify(
    {
      expo: {
        name: plan.appName,
        slug: slugify(plan.appName) || "qorvex-app",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        scheme: slugify(plan.appName) || "qorvex-app",
        userInterfaceStyle: "automatic",
        splash: {
          image: "./assets/splash-icon.png",
          resizeMode: "contain",
          backgroundColor: plan.theme.background,
        },
        ios: {
          supportsTablet: true,
          bundleIdentifier: `com.qorvex.${slugify(plan.appName) || "app"}`,
        },
        android: {
          adaptiveIcon: {
            foregroundImage: "./assets/adaptive-icon.png",
            backgroundColor: plan.theme.background,
          },
          package: `com.qorvex.${slugify(plan.appName) || "app"}`,
        },
        web: {
          favicon: "./assets/favicon.png",
        },
        plugins: ["expo-router"],
      },
    },
    null,
    2,
  );
}

function buildPackageJson() {
  return JSON.stringify(
    {
      name: "qorvex-generated-app",
      version: "1.0.0",
      private: true,
      main: "expo-router/entry",
      scripts: {
        start: "expo start",
        android: "expo run:android",
        ios: "expo run:ios",
        web: "expo start --web",
      },
      dependencies: {
        expo: "~53.0.0",
        "expo-linear-gradient": "~14.0.0",
        "expo-router": "~5.0.0",
        "expo-status-bar": "~2.0.0",
        react: "19.0.0",
        "react-native": "0.79.0",
        "react-native-safe-area-context": "5.4.0",
        "@expo/vector-icons": "^14.0.0",
        "@supabase/supabase-js": "^2.49.0",
      },
      devDependencies: {
        typescript: "^5.4.0",
      },
    },
    null,
    2,
  );
}

function buildTsConfig() {
  return JSON.stringify(
    {
      extends: "expo/tsconfig.base",
      compilerOptions: {
        strict: true,
        baseUrl: ".",
        paths: {
          "@/*": ["./*"],
        },
      },
    },
    null,
    2,
  );
}

function buildRootLayout() {
  return `import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
`;
}

function buildTabsLayout(plan: AppPlan, screens: ScreenSpec[]) {
  const tabScreens = screens.slice(0, MAX_TABS);
  const entries = tabScreens
    .map((screen, index) => {
      const routeName = index === 0 ? "index" : screen.route;
      return `      <Tabs.Screen
        name="${routeName}"
        options={{
          title: ${JSON.stringify(screen.tabLabel)},
          tabBarIcon: ({ color, size }) => (
            <Ionicons name=${JSON.stringify(screen.icon)} color={color} size={size} />
          ),
        }}
      />`;
    })
    .join("\n");

  return `import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { APP_THEME } from "@/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: APP_THEME.primary,
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          position: "absolute",
          height: 74,
          paddingTop: 8,
          paddingBottom: 10,
          backgroundColor: "rgba(8, 16, 29, 0.96)",
          borderTopColor: "rgba(148, 163, 184, 0.18)",
          borderTopWidth: 1,
        },
        sceneStyle: {
          backgroundColor: APP_THEME.background,
        },
      }}
    >
${entries}
    </Tabs>
  );
}
`;
}

function buildTheme(plan: AppPlan) {
  return `export const APP_THEME = ${JSON.stringify(plan.theme, null, 2)} as const;

export function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return \`rgba(\${red}, \${green}, \${blue}, \${Math.max(0, Math.min(1, alpha))})\`;
}
`;
}

function buildSupabaseHelper() {
  return `import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
`;
}

function buildPlanModule(plan: AppPlan, screens: ScreenSpec[]) {
  return `export const APP_PLAN = ${toConstJson(plan)} as const;

export const SCREEN_SPECS = ${toConstJson(screens)} as const;

export function getScreenSpec(id: string) {
  return SCREEN_SPECS.find((screen) => screen.id === id) ?? SCREEN_SPECS[0];
}
`;
}

function buildAppShellHeader() {
  return `import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";
import { APP_THEME, withAlpha } from "@/lib/theme";

export function AppShellHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions: string[];
}) {
  return (
    <LinearGradient
      colors={[
        withAlpha(APP_THEME.primary, 0.34),
        withAlpha(APP_THEME.secondary, 0.18),
        "rgba(9, 14, 24, 0.96)",
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 28,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        overflow: "hidden",
        gap: 14,
      }}
    >
      <View
        style={{
          position: "absolute",
          right: -28,
          top: -20,
          width: 140,
          height: 140,
          borderRadius: 999,
          backgroundColor: withAlpha(APP_THEME.accent, 0.16),
        }}
      />

      <View style={{ gap: 8 }}>
        <Text style={{ color: "white", fontSize: 30, fontWeight: "800", letterSpacing: -0.8 }}>
          {title}
        </Text>
        <Text style={{ color: "#d7e0ee", fontSize: 15, lineHeight: 22 }}>
          {subtitle}
        </Text>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {actions.map((action) => (
          <View
            key={action}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 999,
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.1)",
            }}
          >
            <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>{action}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}
`;
}

function buildScreenRenderer() {
  return `import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppShellHeader } from "@/components/app-shell/AppShellHeader";
import { SectionBlock } from "@/components/app-shell/SectionBlock";
import { APP_THEME, withAlpha } from "@/lib/theme";

interface ScreenSpec {
  id: string;
  title: string;
  subtitle: string;
  primaryActions: string[];
  emptyState: { title: string; body: string; cta: string };
  loadingState: { title: string; body: string };
  sections: Array<{
    type: "hero" | "stats" | "list" | "chart" | "actions" | "empty";
    title: string;
    body?: string;
    value?: string;
    cta?: string;
    items?: Array<Record<string, string | number>>;
  }>;
}

export function ScreenRenderer({ screen }: { screen: ScreenSpec }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: APP_THEME.background }}>
      <View
        style={{
          position: "absolute",
          left: -40,
          top: 80,
          width: 180,
          height: 180,
          borderRadius: 999,
          backgroundColor: withAlpha(APP_THEME.primary, 0.1),
        }}
      />
      <View
        style={{
          position: "absolute",
          right: -36,
          top: 210,
          width: 160,
          height: 160,
          borderRadius: 999,
          backgroundColor: withAlpha(APP_THEME.secondary, 0.08),
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <AppShellHeader
          title={screen.title}
          subtitle={screen.subtitle}
          actions={screen.primaryActions}
        />

        <View
          style={{
            flexDirection: "row",
            gap: 12,
          }}
        >
          <View
            style={{
              flex: 1,
              borderRadius: 20,
              padding: 14,
              backgroundColor: "rgba(12, 18, 30, 0.88)",
              borderWidth: 1,
              borderColor: "rgba(148, 163, 184, 0.12)",
              gap: 4,
            }}
          >
            <Text style={{ color: "#8ea4bf", fontSize: 12, textTransform: "uppercase" }}>
              Live state
            </Text>
            <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
              {screen.loadingState.title}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              borderRadius: 20,
              padding: 14,
              backgroundColor: "rgba(12, 18, 30, 0.88)",
              borderWidth: 1,
              borderColor: "rgba(148, 163, 184, 0.12)",
              gap: 4,
            }}
          >
            <Text style={{ color: "#8ea4bf", fontSize: 12, textTransform: "uppercase" }}>
              Next best action
            </Text>
            <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
              {screen.emptyState.cta}
            </Text>
          </View>
        </View>

        {screen.sections.map((section) => (
          <SectionBlock key={section.title} section={section} />
        ))}

        <View
          style={{
            borderRadius: 22,
            padding: 18,
            backgroundColor: "rgba(12, 20, 36, 0.82)",
            borderWidth: 1,
            borderColor: withAlpha(APP_THEME.accent, 0.3),
            gap: 8,
          }}
        >
          <Text style={{ color: "#f8fafc", fontSize: 16, fontWeight: "700" }}>
            {screen.emptyState.title}
          </Text>
          <Text style={{ color: "#cbd5e1", lineHeight: 20 }}>
            {screen.emptyState.body}
          </Text>
          <Text style={{ color: APP_THEME.accent, fontWeight: "700" }}>
            {screen.emptyState.cta}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
`;
}

function buildSectionListRow() {
  return `import { Text, View } from "react-native";

export function SectionListRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        gap: 16,
      }}
    >
      <Text style={{ flex: 1, color: "#f8fafc", fontWeight: "600" }}>{label}</Text>
      <Text style={{ color: "#9fb0c5", textAlign: "right" }}>{value}</Text>
    </View>
  );
}
`;
}

function buildSectionBlock() {
  return `import { Text, View } from "react-native";
import { SectionListRow } from "@/components/app-shell/SectionListRow";
import { StatPill } from "@/components/app-shell/StatPill";
import { APP_THEME, withAlpha } from "@/lib/theme";

interface Section {
  type: "hero" | "stats" | "list" | "chart" | "actions" | "empty";
  title: string;
  body?: string;
  value?: string;
  cta?: string;
  items?: Array<Record<string, string | number>>;
}

function renderChart(items: Array<Record<string, string | number>> = []) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 10, marginTop: 8 }}>
      {items.map((item, index) => {
        const value = Number(item.value) || 30 + index * 10;
        return (
          <View key={\`\${item.label ?? "item"}-\${index}\`} style={{ flex: 1, gap: 6 }}>
            <View
              style={{
                height: Math.max(36, Math.min(120, value)),
                borderRadius: 16,
                backgroundColor: index % 2 === 0 ? APP_THEME.primary : APP_THEME.secondary,
              }}
            />
            <Text style={{ color: "#cbd5e1", fontSize: 12 }}>{String(item.label ?? "Point")}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function SectionBlock({ section }: { section: Section }) {
  const items = section.items ?? [];
  const isHero = section.type === "hero";

  return (
    <View
      style={{
        borderRadius: isHero ? 26 : 22,
        padding: isHero ? 18 : 16,
        backgroundColor: isHero
          ? withAlpha(APP_THEME.primary, 0.16)
          : "rgba(15, 23, 42, 0.74)",
        borderWidth: 1,
        borderColor: isHero
          ? withAlpha(APP_THEME.primary, 0.24)
          : "rgba(148, 163, 184, 0.14)",
        gap: 10,
      }}
    >
      <View style={{ gap: 4 }}>
        <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>{section.title}</Text>
        {section.body ? (
          <Text style={{ color: "#cbd5e1", lineHeight: 20 }}>{section.body}</Text>
        ) : null}
      </View>

      {section.value ? (
        <Text style={{ color: APP_THEME.accent, fontSize: 28, fontWeight: "700" }}>
          {section.value}
        </Text>
      ) : null}

      {(section.type === "stats" || section.type === "actions") && items.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {items.map((item, index) => (
            <StatPill key={\`\${item.label ?? "metric"}-\${index}\`} label={String(item.label ?? "Metric")} value={String(item.value ?? "")} />
          ))}
        </View>
      ) : null}

      {section.type === "list" && items.length > 0 ? (
        <View style={{ gap: 10 }}>
          {items.map((item, index) => (
            <View
              key={\`\${item.label ?? "row"}-\${index}\`}
              style={{
                borderBottomWidth: index === items.length - 1 ? 0 : 1,
                borderBottomColor: "rgba(148, 163, 184, 0.12)",
              }}
            >
              <SectionListRow
                label={String(item.label ?? "Item")}
                value={String(item.value ?? "")}
              />
            </View>
          ))}
        </View>
      ) : null}

      {section.type === "chart" ? renderChart(items) : null}

      {section.type === "empty" ? (
        <View style={{ gap: 4 }}>
          <Text style={{ color: "#e2e8f0" }}>{section.body ?? "This state is ready for first-run users."}</Text>
          {section.cta ? (
            <Text style={{ color: APP_THEME.primary, fontWeight: "700" }}>{section.cta}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
`;
}

function buildStatPill() {
  return `import { Text, View } from "react-native";

export function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        minWidth: 110,
        gap: 4,
        borderRadius: 18,
        backgroundColor: "rgba(30, 41, 59, 0.9)",
        paddingHorizontal: 14,
        paddingVertical: 12,
      }}
    >
      <Text style={{ color: "#94a3b8", fontSize: 12 }}>{label}</Text>
      <Text style={{ color: "white", fontSize: 17, fontWeight: "700" }}>{value}</Text>
    </View>
  );
}
`;
}

function buildScreenFile(screen: ScreenSpec) {
  return `import { ScreenRenderer } from "@/components/app-shell/ScreenRenderer";
import { getScreenSpec } from "@/lib/app-plan";

export default function ${toTitleCase(screen.id).replace(/\s+/g, "")}Screen() {
  return <ScreenRenderer screen={getScreenSpec(${JSON.stringify(screen.id)})} />;
}
`;
}

function buildFilesFromManifest(
  plan: AppPlan,
  screens: ScreenSpec[],
  manifest: FileManifestEntry[],
) {
  const files: Record<string, string> = {};

  for (const entry of manifest) {
    switch (entry.path) {
      case "app.json":
        files[entry.path] = buildAppJson(plan);
        break;
      case "package.json":
        files[entry.path] = buildPackageJson();
        break;
      case "tsconfig.json":
        files[entry.path] = buildTsConfig();
        break;
      case "app/_layout.tsx":
        files[entry.path] = buildRootLayout();
        break;
      case "app/(tabs)/_layout.tsx":
        files[entry.path] = buildTabsLayout(plan, screens);
        break;
      case "components/app-shell/AppShellHeader.tsx":
        files[entry.path] = buildAppShellHeader();
        break;
      case "components/app-shell/ScreenRenderer.tsx":
        files[entry.path] = buildScreenRenderer();
        break;
      case "components/app-shell/SectionBlock.tsx":
        files[entry.path] = buildSectionBlock();
        break;
      case "components/app-shell/SectionListRow.tsx":
        files[entry.path] = buildSectionListRow();
        break;
      case "components/app-shell/StatPill.tsx":
        files[entry.path] = buildStatPill();
        break;
      case "lib/app-plan.ts":
        files[entry.path] = buildPlanModule(plan, screens);
        break;
      case "lib/theme.ts":
        files[entry.path] = buildTheme(plan);
        break;
      case "lib/supabase.ts":
        files[entry.path] = buildSupabaseHelper();
        break;
      default: {
        const screen = screens.find((item) => item.id === entry.screenId);
        if (screen) {
          files[entry.path] = buildScreenFile(screen);
        }
      }
    }
  }

  return files;
}

function buildPreview(plan: AppPlan, screens: ScreenSpec[]): ProjectPreviewModel {
  const previewScreens: ProjectPreviewScreen[] = screens.map((screen) => ({
    id: screen.id,
    title: screen.title,
    subtitle: screen.subtitle,
    icon: screen.icon,
    sections: screen.sections,
  }));

  return {
    appName: plan.appName,
    description: plan.description,
    theme: plan.theme,
    navigation: {
      type: plan.navigation.type,
      tabs: screens.slice(0, MAX_TABS).map((screen) => screen.tabLabel),
    },
    screens: previewScreens,
    components: [
      "AppShellHeader",
      "ScreenRenderer",
      "SectionBlock",
      "SectionListRow",
      "StatPill",
      "Tab navigation",
    ],
    sampleData: {
      ...plan.sampleData,
      entities: plan.entities,
      features: plan.features,
    },
  };
}

async function runStructuredStage<T>({
  stageName,
  systemPrompt,
  prompt,
  maxTokens,
  thinkingBudget,
  responseSchema,
  fallback,
  normalize,
  warnings,
  ensureStageBudget,
  onUsage,
}: {
  stageName: string;
  systemPrompt: string;
  prompt: string;
  maxTokens: number;
  thinkingBudget?: number;
  responseSchema?: Record<string, unknown>;
  fallback: T;
  normalize: (value: unknown, fallback: T) => T;
  warnings: string[];
  ensureStageBudget?: (
    stageName: string,
    prompt: string,
    maxTokens: number,
  ) => Promise<{ allowed: boolean; message?: string }>;
  onUsage?: (usage: AIUsage) => Promise<void> | void;
}) {
  let lastError: string | null = null;
  const provider = getAIProvider();

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const attemptPrompt =
        attempt === 1
          ? prompt
          : `${prompt}

Retry requirements:
- previous attempt issue: ${lastError ?? "response quality or JSON validity"}
- return one strict valid JSON object only
- be more specific, more product-grade, and less generic
- avoid placeholder wording and repeated patterns
- preserve the requested app domain and features`;

      const budgetCheck = ensureStageBudget
        ? await ensureStageBudget(stageName, attemptPrompt, maxTokens)
        : { allowed: true };

      if (!budgetCheck.allowed) {
        warnings.push(
          budgetCheck.message ??
            `${stageName} skipped because the daily AI credit budget is too low.`,
        );
        return fallback;
      }

      const result = await withTimeout(
        provider.generateText({
          systemPrompt,
          prompt: attemptPrompt,
          maxTokens,
          temperature: attempt === 1 ? 0.15 : 0.1,
          thinkingBudget,
          responseMimeType: "application/json",
          responseSchema,
        }),
        45000,
        `${stageName} timed out before the AI response completed.`,
      );
      await onUsage?.(result.usage);
      const parsed = tryParseJson<unknown>(result.text);
      if (parsed === null) {
        throw new Error(`${stageName} returned invalid JSON`);
      }
      return normalize(parsed, fallback);
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  warnings.push(`${stageName} fallback used: ${lastError ?? "unknown stage error"}`);
  return fallback;
}

function buildPlanPrompt(input: GenerationPipelineInput) {
  const prompt = sanitizePrompt(input.prompt);
  const features = sanitizeFeatures(input.features);

  return {
    systemPrompt:
      "You are a principal product designer, staff mobile PM, and Expo architect creating launch-ready app plans. Think in terms of product value, retention loops, dense but clear UX, realistic entities, and differentiated mobile interactions. Avoid demo-ware. Respond with one valid JSON object only.",
    prompt: `Create an app plan JSON.
appName: ${input.projectName}
platform: ${input.platform}
template: ${input.templateId ?? "custom"}
colors: ${input.colors.primary}, ${input.colors.secondary}, ${input.colors.accent}
features: ${features.join(", ") || "core flow, auth, profile"}
prompt: ${prompt}

Return JSON:
{
  "appName": "string",
  "description": "string",
  "theme": { "primary": "string", "secondary": "string", "accent": "string", "background": "${DEFAULT_APP_BACKGROUND}" },
  "navigation": { "type": "tabs", "tabs": ["string"] },
  "screens": [{ "id": "string", "title": "string", "purpose": "string", "route": "string", "tabLabel": "string", "icon": "string" }],
  "features": ["string"],
  "entities": ["string"],
  "sampleData": { "key": "value" },
  "architecture": { "routing": "string", "styling": "string", "backend": "string", "state": "string" }
}

Rules:
- 4 to 6 screens
- include one clear primary workflow, one supporting workflow, and one retention/return loop
- specific to the app idea
- include auth or onboarding when relevant
- include profile or settings
- include at least one screen that feels operational, data-rich, or action-oriented
- tabs should be concise
- use a near-black app background by default
- avoid generic filler such as repeated 'Welcome' dashboards unless the product truly needs it
- prefer differentiated flows, clear user value, and realistic product entities
- feature names should sound shippable, not aspirational
- sampleData should contain domain-realistic nouns, labels, and seed values
- make the information architecture feel like a launch-ready app, not a demo
- no markdown`,
  };
}

function buildScreenPrompt(plan: AppPlan) {
  return {
    systemPrompt:
      "You convert app plans into rich, premium mobile screen specs for a high-end Expo product. Make each screen useful on first open, visually intentional, and materially different from the others. Favor practical product depth over chrome. Respond with one valid JSON object only.",
    prompt: `Expand this plan into detailed screen specs.
plan: ${JSON.stringify({
      appName: plan.appName,
      description: plan.description,
      navigation: plan.navigation,
      screens: plan.screens,
      features: plan.features,
      entities: plan.entities,
      sampleData: plan.sampleData,
    })}

Return JSON:
{
  "screens": [
    {
      "id": "string",
      "title": "string",
      "subtitle": "string",
      "route": "string",
      "tabLabel": "string",
      "icon": "string",
      "primaryActions": ["string"],
      "loadingState": { "title": "string", "body": "string" },
      "emptyState": { "title": "string", "body": "string", "cta": "string" },
      "sections": [
        {
          "type": "hero | stats | list | chart | actions | empty",
          "title": "string",
          "body": "string",
          "value": "string",
          "cta": "string",
          "items": [{ "label": "string", "value": "string or number" }]
        }
      ]
    }
  ]
}

Rules:
- every screen needs 3 to 5 realistic sections
- include app-specific labels and sample content
- include charts only when domain-relevant
- do not repeat the same generic wording across screens
- the home screen should feel immediately useful, not like placeholder marketing copy
- vary section structure between screens; avoid cloning the same card pattern everywhere
- include specific metrics, lists, CTAs, and microcopy that match the app domain
- at least one section per screen should contain a concrete user decision, next action, or prioritization cue
- hero sections should feel editorial and premium, not like empty dashboard filler
- avoid vague subtitles such as "manage everything in one place"
- prefer practical depth over decorative filler
- no markdown`,
  };
}

function partitionManifest(manifest: FileManifestEntry[]) {
  const groups: FileManifestEntry[][] = [];
  const core = manifest.filter((entry) => ["config", "layout", "lib"].includes(entry.kind));
  const components = manifest.filter((entry) => entry.kind === "component");
  const screens = manifest.filter((entry) => entry.kind === "screen");

  if (core.length > 0) groups.push(core);
  if (components.length > 0) groups.push(components);

  for (let index = 0; index < screens.length; index += 2) {
    groups.push(screens.slice(index, index + 2));
  }

  return groups;
}

export async function executeGenerationPipeline(
  input: GenerationPipelineInput,
  onEvent: (event: GenerationPipelineEvent) => void,
  onNotice?: (message: string) => void,
  options?: {
    ensureStageBudget?: (
      stageName: string,
      prompt: string,
      maxTokens: number,
    ) => Promise<{ allowed: boolean; message?: string }>;
    onUsage?: (usage: AIUsage) => Promise<void> | void;
  },
) {
  const warnings: string[] = [];
  const usage: AIUsage[] = [];
  const sanitizedInput: GenerationPipelineInput = {
    ...input,
    prompt: sanitizePrompt(input.prompt),
    features: sanitizeFeatures(input.features),
  };

  if (isLargeRequest(sanitizedInput)) {
    onNotice?.(STAGE_MESSAGE);
  }

  onEvent({
    stage: "planning",
    percent: 12,
    message: "Planning app architecture",
  });

  const fallbackPlan = buildFallbackPlan(sanitizedInput);
  const planPrompt = buildPlanPrompt(sanitizedInput);
  const plan = await runStructuredStage<AppPlan>({
    stageName: "plan stage",
    systemPrompt: planPrompt.systemPrompt,
    prompt: planPrompt.prompt,
    maxTokens: 2800,
    thinkingBudget: 4096,
    responseSchema: appPlanSchema(),
    fallback: fallbackPlan,
    normalize: normalizePlan,
    warnings,
    ensureStageBudget: options?.ensureStageBudget,
    onUsage: async (stageUsage) => {
      usage.push(stageUsage);
      await options?.onUsage?.(stageUsage);
    },
  });

  onEvent({
    stage: "screens",
    percent: 32,
    message: "Generating screens",
  });

  const screenFallback = fallbackScreenSpecs(plan);
  const screenPrompt = buildScreenPrompt(plan);
  const screens = await runStructuredStage<ScreenSpec[]>({
    stageName: "screen stage",
    systemPrompt: screenPrompt.systemPrompt,
    prompt: screenPrompt.prompt,
    maxTokens: 4800,
    thinkingBudget: 8192,
    responseSchema: screenSpecsSchema(),
    fallback: screenFallback,
    normalize: normalizeScreenSpecs,
    warnings,
    ensureStageBudget: options?.ensureStageBudget,
    onUsage: async (stageUsage) => {
      usage.push(stageUsage);
      await options?.onUsage?.(stageUsage);
    },
  });

  onEvent({
    stage: "navigation",
    percent: 48,
    message: "Creating navigation",
  });

  const manifest = buildFileManifest(screens);
  const batches = partitionManifest(manifest);
  const files: Record<string, string> = {};
  let partial = false;

  for (let index = 0; index < batches.length; index++) {
    const batch = batches[index];
    const percent = 54 + Math.round(((index + 1) / batches.length) * 26);

    onEvent({
      stage: "components",
      percent,
      message:
        index < 2
          ? "Building components"
          : `Building screens ${index - 1} of ${Math.max(1, batches.length - 2)}`,
    });

    try {
      const generated = buildFilesFromManifest(plan, screens, batch);
      Object.assign(files, generated);
    } catch (error) {
      partial = true;
      warnings.push(
        `file batch ${index + 1} fallback used: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  onEvent({
    stage: "preview",
    percent: 88,
    message: "Preparing preview",
  });

  const preview = buildPreview(plan, screens);

  onEvent({
    stage: "finalizing",
    percent: 97,
    message: "Finalizing project",
  });

  return {
    files: withProjectPreviewFile(files, preview),
    preview,
    partial: partial || warnings.length > 0,
    warnings,
    usage,
  } satisfies GenerationPipelineResult;
}
