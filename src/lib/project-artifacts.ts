import type { GeneratedFile, ProjectColors } from "@/types";

export const PROJECT_PREVIEW_FILE = ".qorvex/preview.json";
export const PROJECT_CHAT_HISTORY_FILE = ".qorvex/chat-history.json";

export interface ProjectPreviewTheme {
  primary: string;
  secondary: string;
  accent: string;
  background?: string;
}

export interface ProjectPreviewNavigation {
  type: "tabs" | "stack" | "mixed";
  tabs: string[];
}

export interface ProjectPreviewSection {
  type: "hero" | "stats" | "list" | "chart" | "actions" | "empty";
  title: string;
  body?: string;
  value?: string;
  cta?: string;
  items?: Array<Record<string, string | number>>;
}

export interface ProjectPreviewScreen {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  sections: ProjectPreviewSection[];
}

export interface ProjectPreviewModel {
  appName: string;
  description: string;
  theme: ProjectPreviewTheme;
  navigation: ProjectPreviewNavigation;
  screens: ProjectPreviewScreen[];
  components: string[];
  sampleData: Record<string, unknown>;
}

export interface ProjectChatHistoryMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: string;
}

interface GenerationPayloadLike {
  appName?: string;
  description?: string;
  theme?: Partial<ProjectPreviewTheme>;
  navigation?: Partial<ProjectPreviewNavigation>;
  screens?: ProjectPreviewScreen[];
  components?: string[];
  sampleData?: Record<string, unknown>;
  files?: Record<string, string>;
  preview?: Partial<ProjectPreviewModel>;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFileMap(value: unknown): value is Record<string, string> {
  return (
    isRecord(value) &&
    Object.values(value).every((entry) => typeof entry === "string")
  );
}

function normalizeStringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) return fallback;
  const next = value.filter((item): item is string => typeof item === "string");
  return next.length > 0 ? next : fallback;
}

function normalizeSection(section: unknown): ProjectPreviewSection | null {
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

  const items = Array.isArray(section.items)
    ? section.items.filter((item): item is Record<string, string | number> =>
        isRecord(item),
      )
    : undefined;

  return {
    type,
    title: section.title,
    body: typeof section.body === "string" ? section.body : undefined,
    value: typeof section.value === "string" ? section.value : undefined,
    cta: typeof section.cta === "string" ? section.cta : undefined,
    items,
  };
}

function normalizeScreen(screen: unknown): ProjectPreviewScreen | null {
  if (!isRecord(screen) || typeof screen.title !== "string") return null;
  const sections = Array.isArray(screen.sections)
    ? screen.sections
        .map((section) => normalizeSection(section))
        .filter((section): section is ProjectPreviewSection => Boolean(section))
    : [];

  return {
    id:
      typeof screen.id === "string" && screen.id.trim()
        ? screen.id
        : slugify(screen.title),
    title: screen.title,
    subtitle: typeof screen.subtitle === "string" ? screen.subtitle : undefined,
    icon: typeof screen.icon === "string" ? screen.icon : undefined,
    sections,
  };
}

function getDomain(prompt: string) {
  const lower = prompt.toLowerCase();

  if (/finance|budget|expense|bank|investment|crypto|wallet/.test(lower)) {
    return "finance";
  }
  if (/fitness|workout|gym|health|meal|nutrition|running/.test(lower)) {
    return "fitness";
  }
  if (/restaurant|booking|reservation|table|dining|food/.test(lower)) {
    return "restaurant";
  }
  if (/shop|ecommerce|store|cart|checkout|product/.test(lower)) {
    return "commerce";
  }
  if (/travel|trip|hotel|itinerary|flight/.test(lower)) {
    return "travel";
  }
  if (/social|community|chat|feed|creator/.test(lower)) {
    return "social";
  }

  return "generic";
}

function inferPreviewFromPrompt(
  projectName: string,
  prompt: string,
  colors: ProjectColors,
): ProjectPreviewModel {
  const domain = getDomain(`${projectName} ${prompt}`);

  const baseTheme: ProjectPreviewTheme = {
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent,
    background: "#0b1020",
  };

  if (domain === "finance") {
    return {
      appName: projectName,
      description:
        "A finance app with dashboards, transaction tracking, budgeting, and profile settings.",
      theme: baseTheme,
      navigation: {
        type: "tabs",
        tabs: ["Overview", "Transactions", "Budgets", "Insights", "Profile"],
      },
      screens: [
        {
          id: "overview",
          title: "Overview",
          subtitle: "This month at a glance",
          sections: [
            {
              type: "hero",
              title: "Net balance",
              value: "$12,480",
              body: "Income is up 12% compared with last month.",
            },
            {
              type: "stats",
              title: "Top metrics",
              items: [
                { label: "Income", value: "$8,900", change: "+8%" },
                { label: "Spending", value: "$3,240", change: "-4%" },
                { label: "Savings", value: "$1,860", change: "+15%" },
              ],
            },
            {
              type: "chart",
              title: "Weekly trend",
              items: [
                { label: "Mon", value: 40 },
                { label: "Tue", value: 62 },
                { label: "Wed", value: 58 },
                { label: "Thu", value: 76 },
                { label: "Fri", value: 88 },
              ],
            },
          ],
        },
        {
          id: "transactions",
          title: "Transactions",
          subtitle: "Recent activity",
          sections: [
            {
              type: "list",
              title: "Latest transactions",
              items: [
                { title: "Salary", subtitle: "Acme Inc", value: "+$4,500" },
                { title: "Groceries", subtitle: "Fresh Market", value: "-$84" },
                { title: "Coffee", subtitle: "North Roast", value: "-$6" },
              ],
            },
          ],
        },
        {
          id: "budgets",
          title: "Budgets",
          subtitle: "Category control",
          sections: [
            {
              type: "stats",
              title: "Budget status",
              items: [
                { label: "Food", value: "$620 / $800" },
                { label: "Travel", value: "$180 / $400" },
                { label: "Shopping", value: "$240 / $300" },
              ],
            },
            {
              type: "empty",
              title: "Unused category",
              body: "Entertainment has no spending this week.",
            },
          ],
        },
        {
          id: "insights",
          title: "Insights",
          subtitle: "Spending analysis",
          sections: [
            {
              type: "list",
              title: "Smart insights",
              items: [
                { title: "Dining trend", subtitle: "18% lower than last week" },
                { title: "Subscription review", subtitle: "2 unused services detected" },
              ],
            },
          ],
        },
        {
          id: "profile",
          title: "Profile",
          subtitle: "Account and preferences",
          sections: [
            {
              type: "actions",
              title: "Quick settings",
              items: [
                { label: "Linked bank accounts", value: 3 },
                { label: "Notifications", value: "Enabled" },
                { label: "Weekly report", value: "Monday" },
              ],
            },
          ],
        },
      ],
      components: ["BalanceHero", "BudgetCard", "TransactionRow", "InsightCard"],
      sampleData: {
        categories: ["Food", "Travel", "Shopping", "Bills"],
        recurringTransactions: 6,
      },
    };
  }

  if (domain === "fitness") {
    return {
      appName: projectName,
      description:
        "A fitness app with plans, workouts, progress tracking, recovery insights, and account settings.",
      theme: baseTheme,
      navigation: {
        type: "tabs",
        tabs: ["Today", "Workouts", "Progress", "Goals", "Profile"],
      },
      screens: [
        {
          id: "today",
          title: "Today",
          subtitle: "Your training snapshot",
          sections: [
            {
              type: "hero",
              title: "Weekly streak",
              value: "6 days",
              body: "One more workout to hit your weekly target.",
            },
            {
              type: "stats",
              title: "Focus metrics",
              items: [
                { label: "Calories", value: "540 kcal" },
                { label: "Workout time", value: "48 min" },
                { label: "Recovery", value: "82%" },
              ],
            },
          ],
        },
        {
          id: "workouts",
          title: "Workouts",
          subtitle: "Upcoming sessions",
          sections: [
            {
              type: "list",
              title: "Plan",
              items: [
                { title: "Upper body strength", subtitle: "45 min" },
                { title: "Mobility reset", subtitle: "12 min" },
                { title: "5k tempo run", subtitle: "35 min" },
              ],
            },
          ],
        },
        {
          id: "progress",
          title: "Progress",
          subtitle: "Consistency and improvements",
          sections: [
            {
              type: "chart",
              title: "Workout volume",
              items: [
                { label: "Week 1", value: 28 },
                { label: "Week 2", value: 35 },
                { label: "Week 3", value: 42 },
                { label: "Week 4", value: 46 },
              ],
            },
          ],
        },
        {
          id: "goals",
          title: "Goals",
          subtitle: "Milestones in progress",
          sections: [
            {
              type: "stats",
              title: "Targets",
              items: [
                { label: "Bodyweight", value: "74kg / 72kg" },
                { label: "Push-ups", value: "38 / 50" },
                { label: "Weekly sessions", value: "4 / 5" },
              ],
            },
          ],
        },
        {
          id: "profile",
          title: "Profile",
          subtitle: "Preferences and recovery",
          sections: [
            {
              type: "actions",
              title: "Settings",
              items: [
                { label: "Workout reminders", value: "7:00 AM" },
                { label: "Equipment", value: "Home + Gym" },
                { label: "Rest day", value: "Sunday" },
              ],
            },
          ],
        },
      ],
      components: ["WorkoutCard", "RecoveryGauge", "GoalProgress", "StreakHero"],
      sampleData: {
        workouts: ["Leg day", "Tempo run", "Mobility", "Upper body"],
        weeklyTarget: 5,
      },
    };
  }

  if (domain === "restaurant") {
    return {
      appName: projectName,
      description:
        "A restaurant booking app with discovery, reservation flow, saved tables, and account preferences.",
      theme: baseTheme,
      navigation: {
        type: "tabs",
        tabs: ["Discover", "Bookings", "Favorites", "Messages", "Profile"],
      },
      screens: [
        {
          id: "discover",
          title: "Discover",
          subtitle: "Tonight's best options",
          sections: [
            {
              type: "hero",
              title: "Featured restaurant",
              value: "La Marina",
              body: "Waterfront dining with 2 tables left at 7:30 PM.",
            },
            {
              type: "list",
              title: "Nearby restaurants",
              items: [
                { title: "Juniper Grill", subtitle: "Italian . 12 min" },
                { title: "Nori House", subtitle: "Sushi . 18 min" },
                { title: "Mabel Kitchen", subtitle: "Modern Bistro . 9 min" },
              ],
            },
          ],
        },
        {
          id: "booking",
          title: "Booking",
          subtitle: "Reservation details",
          sections: [
            {
              type: "stats",
              title: "Reservation form",
              items: [
                { label: "Party size", value: "4 guests" },
                { label: "Date", value: "Friday, 8:00 PM" },
                { label: "Dining area", value: "Patio" },
              ],
            },
          ],
        },
        {
          id: "bookings",
          title: "Bookings",
          subtitle: "Upcoming reservations",
          sections: [
            {
              type: "list",
              title: "Reserved tables",
              items: [
                { title: "La Marina", subtitle: "Fri 8:00 PM", value: "Confirmed" },
                { title: "Juniper Grill", subtitle: "Sun 1:00 PM", value: "Pending" },
              ],
            },
          ],
        },
        {
          id: "favorites",
          title: "Favorites",
          subtitle: "Saved places",
          sections: [
            {
              type: "empty",
              title: "Waitlist option",
              body: "Turn on alerts when your favorite restaurants open a table.",
            },
          ],
        },
        {
          id: "profile",
          title: "Profile",
          subtitle: "Dining preferences",
          sections: [
            {
              type: "actions",
              title: "Preferences",
              items: [
                { label: "Cuisine", value: "Italian, Sushi" },
                { label: "Dietary notes", value: "Vegetarian options" },
                { label: "Saved guests", value: 6 },
              ],
            },
          ],
        },
      ],
      components: ["RestaurantCard", "ReservationCard", "AvailabilityPill"],
      sampleData: {
        cuisines: ["Italian", "Sushi", "Bistro"],
        savedRestaurants: 9,
      },
    };
  }

  return {
    appName: projectName,
    description:
      "A polished mobile app with multiple screens, realistic content blocks, guided actions, and account settings.",
    theme: baseTheme,
    navigation: {
      type: "tabs",
      tabs: ["Home", "Explore", "Activity", "Saved", "Profile"],
    },
    screens: [
      {
        id: "home",
        title: "Home",
        subtitle: "Overview and highlights",
        sections: [
          {
            type: "hero",
            title: "Today's focus",
            value: "Ready",
            body: prompt.slice(0, 120) || "Your app is ready to explore.",
          },
          {
            type: "stats",
            title: "Highlights",
            items: [
              { label: "Tasks", value: "12" },
              { label: "Updates", value: "4" },
              { label: "Saved", value: "9" },
            ],
          },
        ],
      },
      {
        id: "explore",
        title: "Explore",
        subtitle: "Discover key sections",
        sections: [
          {
            type: "list",
            title: "Suggested actions",
            items: [
              { title: "Review dashboard", subtitle: "Updated 2 minutes ago" },
              { title: "Check recent activity", subtitle: "3 new items" },
              { title: "Open settings", subtitle: "Personalize the experience" },
            ],
          },
        ],
      },
      {
        id: "activity",
        title: "Activity",
        subtitle: "Recent changes",
        sections: [
          {
            type: "chart",
            title: "Engagement trend",
            items: [
              { label: "Mon", value: 26 },
              { label: "Tue", value: 34 },
              { label: "Wed", value: 41 },
              { label: "Thu", value: 39 },
              { label: "Fri", value: 52 },
            ],
          },
        ],
      },
      {
        id: "saved",
        title: "Saved",
        subtitle: "Pinned items",
        sections: [
          {
            type: "empty",
            title: "Nothing saved yet",
            body: "Pin important items here for quick access.",
            cta: "Save an item",
          },
        ],
      },
      {
        id: "profile",
        title: "Profile",
        subtitle: "Account and preferences",
        sections: [
          {
            type: "actions",
            title: "Settings",
            items: [
              { label: "Notifications", value: "Enabled" },
              { label: "Theme", value: "System" },
              { label: "Language", value: "English" },
            ],
          },
        ],
      },
    ],
    components: ["HeroPanel", "MetricGrid", "InsightList", "ProfileActions"],
    sampleData: {
      cards: 4,
      listItems: 6,
    },
  };
}

const CSS_COLOR_PATTERN =
  /^(#[0-9a-f]{3,8}|rgb\(.+\)|rgba\(.+\)|hsl\(.+\)|hsla\(.+\)|linear-gradient\(.+\)|radial-gradient\(.+\)|conic-gradient\(.+\)|[a-z]+)$/i;

function normalizeCssColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    // AI sometimes returns objects like { color: "#1A1A1A", pattern: "..." }.
    // Recover by reading a nested `color` field, else fall back.
    if (
      value &&
      typeof value === "object" &&
      typeof (value as Record<string, unknown>).color === "string"
    ) {
      return normalizeCssColor((value as Record<string, unknown>).color, fallback);
    }
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  // Gradients legitimately contain spaces; check those against the trimmed
  // form. For everything else (hex, rgb(), named colors), collapse internal
  // spaces so that "light blue" → "lightblue".
  if (/^(linear|radial|conic)-gradient\(/i.test(trimmed)) {
    return CSS_COLOR_PATTERN.test(trimmed.replace(/\s+/g, "")) ? trimmed : fallback;
  }
  const single = trimmed.replace(/\s+/g, "");
  return CSS_COLOR_PATTERN.test(single) ? single : fallback;
}

function normalizePreviewModel(
  input: Partial<ProjectPreviewModel> | null | undefined,
  fallback: ProjectPreviewModel,
): ProjectPreviewModel {
  const screens = Array.isArray(input?.screens)
    ? input.screens
        .map((screen) => normalizeScreen(screen))
        .filter((screen): screen is ProjectPreviewScreen => Boolean(screen))
    : [];

  return {
    appName: input?.appName?.trim() || fallback.appName,
    description: input?.description?.trim() || fallback.description,
    theme: {
      primary: normalizeCssColor(input?.theme?.primary, fallback.theme.primary),
      secondary: normalizeCssColor(
        input?.theme?.secondary,
        fallback.theme.secondary,
      ),
      accent: normalizeCssColor(input?.theme?.accent, fallback.theme.accent),
      background: normalizeCssColor(
        input?.theme?.background,
        fallback.theme.background ?? "#0b1020",
      ),
    },
    navigation: {
      type:
        input?.navigation?.type === "stack" ||
        input?.navigation?.type === "mixed" ||
        input?.navigation?.type === "tabs"
          ? input.navigation.type
          : fallback.navigation.type,
      tabs:
        normalizeStringArray(input?.navigation?.tabs, fallback.navigation.tabs)
          .slice(0, 6),
    },
    screens: screens.length > 0 ? screens : fallback.screens,
    components: normalizeStringArray(input?.components, fallback.components),
    sampleData:
      isRecord(input?.sampleData) && Object.keys(input.sampleData).length > 0
        ? input.sampleData
        : fallback.sampleData,
  };
}

export function mergeProjectPreview(
  base: ProjectPreviewModel,
  patch: Partial<ProjectPreviewModel> | null | undefined,
): ProjectPreviewModel {
  return normalizePreviewModel(
    patch
      ? {
          ...base,
          ...patch,
          theme: {
            ...base.theme,
            ...patch.theme,
          },
          navigation: {
            ...base.navigation,
            ...patch.navigation,
          },
          screens: patch.screens ?? base.screens,
          components: patch.components ?? base.components,
          sampleData: patch.sampleData ?? base.sampleData,
        }
      : base,
    base,
  );
}

export function parseProjectPreviewFromFiles(
  files: Record<string, string>,
): ProjectPreviewModel | null {
  const raw = files[PROJECT_PREVIEW_FILE];
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ProjectPreviewModel>;
    if (!parsed || typeof parsed !== "object") return null;
    const fallback = inferPreviewFromPrompt(
      parsed.appName ?? "Qorvex App",
      parsed.description ?? "",
      {
        primary: parsed.theme?.primary ?? "#7c3aed",
        secondary: parsed.theme?.secondary ?? "#06b6d4",
        accent: parsed.theme?.accent ?? "#f59e0b",
      },
    );
    return normalizePreviewModel(parsed, fallback);
  } catch {
    return null;
  }
}

export function withProjectPreviewFile(
  files: Record<string, string>,
  preview: ProjectPreviewModel,
) {
  return {
    ...files,
    [PROJECT_PREVIEW_FILE]: JSON.stringify(preview, null, 2),
  };
}

export function parseProjectChatHistoryFromFiles(
  files: Record<string, string>,
): ProjectChatHistoryMessage[] {
  const raw = files[PROJECT_CHAT_HISTORY_FILE];
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry): ProjectChatHistoryMessage | null => {
        if (
          !isRecord(entry) ||
          (entry.role !== "assistant" && entry.role !== "user") ||
          typeof entry.content !== "string"
        ) {
          return null;
        }

        return {
          id:
            typeof entry.id === "string" && entry.id.trim()
              ? entry.id
              : `${entry.role}-${Math.random().toString(36).slice(2, 10)}`,
          role: entry.role,
          content: entry.content,
          createdAt:
            typeof entry.createdAt === "string" && entry.createdAt.trim()
              ? entry.createdAt
              : new Date().toISOString(),
        };
      })
      .filter(
        (entry): entry is ProjectChatHistoryMessage => Boolean(entry),
      );
  } catch {
    return [];
  }
}

export function withProjectChatHistoryFile(
  files: Record<string, string>,
  history: ProjectChatHistoryMessage[],
) {
  return {
    ...files,
    [PROJECT_CHAT_HISTORY_FILE]: JSON.stringify(history, null, 2),
  };
}

export function getVisibleProjectFiles(files: Record<string, string>) {
  return Object.keys(files)
    .filter(
      (path) =>
        path !== PROJECT_PREVIEW_FILE && path !== PROJECT_CHAT_HISTORY_FILE,
    )
    .sort((left, right) => left.localeCompare(right));
}

export function toGeneratedFiles(files: Record<string, string>): GeneratedFile[] {
  return Object.entries(files).map(([path, content]) => ({
    path,
    content,
    language: path.split(".").pop() ?? "txt",
  }));
}

export function getProjectDownloadName(projectName: string) {
  const safeName = slugify(projectName) || "qorvex-project";
  return `${safeName}-expo-project.json`;
}

export function getDownloadableProjectFiles(files: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(files).filter(
      ([path]) =>
        path !== PROJECT_PREVIEW_FILE && path !== PROJECT_CHAT_HISTORY_FILE,
    ),
  );
}

export function parseGenerationResponse(
  rawText: string,
  options: {
    projectName: string;
    prompt: string;
    colors: ProjectColors;
  },
): {
  files: Record<string, string>;
  preview: ProjectPreviewModel;
} | null {
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const fallback = inferPreviewFromPrompt(
    options.projectName,
    options.prompt,
    options.colors,
  );

  try {
    const parsed = JSON.parse(cleaned) as
      | Record<string, string>
      | GenerationPayloadLike;

    if (isFileMap(parsed)) {
      return {
        files: withProjectPreviewFile(parsed, fallback),
        preview: fallback,
      };
    }

    if (isRecord(parsed) && isFileMap(parsed.files)) {
      const explicitPreview = isRecord(parsed.preview)
        ? parsed.preview
        : {
            appName:
              typeof parsed.appName === "string" ? parsed.appName : undefined,
            description:
              typeof parsed.description === "string"
                ? parsed.description
                : undefined,
            theme: isRecord(parsed.theme) ? parsed.theme : undefined,
            navigation: isRecord(parsed.navigation)
              ? parsed.navigation
              : undefined,
            screens: Array.isArray(parsed.screens) ? parsed.screens : undefined,
            components: Array.isArray(parsed.components)
              ? parsed.components
              : undefined,
            sampleData: isRecord(parsed.sampleData)
              ? parsed.sampleData
              : undefined,
          };

      const preview = normalizePreviewModel(
        explicitPreview as Partial<ProjectPreviewModel>,
        fallback,
      );

      return {
        files: withProjectPreviewFile(parsed.files, preview),
        preview,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function getProjectPreviewModel(options: {
  files: Record<string, string>;
  projectName: string;
  prompt?: string | null;
  colors: ProjectColors;
}) {
  return (
    parseProjectPreviewFromFiles(options.files) ??
    inferPreviewFromPrompt(
      options.projectName,
      options.prompt ?? options.projectName,
      options.colors,
    )
  );
}

export function getTabLabelsFromPreview(preview: ProjectPreviewModel) {
  return preview.navigation.tabs.length > 0
    ? preview.navigation.tabs
    : preview.screens.map((screen) => screen.title).slice(0, 5);
}

export function getFileDescription(path: string): string {
  const fileName = path.split("/").pop() ?? path;
  if (fileName === "app.json") return "Expo configuration";
  if (fileName === "package.json") return "Dependencies and scripts";
  if (path.includes("/components/")) return "Reusable component";
  if (path.includes("/lib/")) return "Library helper";
  if (path.endsWith("_layout.tsx")) return "Navigation layout";
  return `${toTitleCase(fileName.replace(/\.(tsx?|jsx?|json|ts)$/i, ""))} file`;
}
