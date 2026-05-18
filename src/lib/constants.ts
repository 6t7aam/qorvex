export const PLANS = {
  FREE: {
    id: "free" as const,
    name: "Free",
    price: 0,
    dailyCredits: 3500,
    dailyCreditsLabel: "3,500 AI credits / day",
    badgeColor: "gray" as const,
    features: [
      "3,500 AI credits refreshed daily",
      "Best for small app tests and quick experiments",
      "Basic templates",
      "Watermark on exports",
      "Structured app generation",
      "Community support",
    ],
  },
  PRO: {
    id: "pro" as const,
    name: "Pro",
    price: 9.99,
    dailyCredits: 18000,
    dailyCreditsLabel: "18,000 AI credits / day",
    badgeColor: "violet" as const,
    mostPopular: true,
    features: [
      "18,000 AI credits refreshed daily",
      "Supports multiple medium and large app generations",
      "Full export (no watermark)",
      "GitHub integration",
      "Premium templates",
      "AI editing chat",
      "Priority staged generation",
    ],
  },
  MAX: {
    id: "max" as const,
    name: "Max",
    price: 29.99,
    dailyCredits: 90000,
    dailyCreditsLabel: "90,000 AI credits / day",
    badgeColor: "gradient" as const,
    features: [
      "90,000 AI credits refreshed daily",
      "Built for long editing sessions and larger apps",
      "Advanced AI editing",
      "App Store export tools",
      "Custom branding",
      "Highest priority generation",
      "Advanced templates",
      "Team / project features",
      "Future premium AI models",
    ],
  },
} as const;

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
] as const;

export type AppTemplateComplexity = "beginner" | "intermediate" | "advanced";

export interface AppTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  tags: string[];
  complexity: AppTemplateComplexity;
  isPremium: boolean;
}

export const APP_TEMPLATES: AppTemplate[] = [
  {
    id: "fitness-tracker",
    name: "Fitness Tracker",
    description: "Track workouts, calories and progress",
    icon: "Dumbbell",
    tags: ["fitness", "health", "tracker"],
    complexity: "beginner",
    isPremium: false,
  },
  {
    id: "habit-tracker",
    name: "Habit Tracker",
    description: "Build and maintain daily habits",
    icon: "CheckSquare",
    tags: ["productivity", "habits", "daily"],
    complexity: "beginner",
    isPremium: false,
  },
  {
    id: "ai-chat",
    name: "AI Chat App",
    description: "Chat interface powered by AI",
    icon: "MessageSquare",
    tags: ["ai", "chat", "messaging"],
    complexity: "intermediate",
    isPremium: false,
  },
  {
    id: "social-app",
    name: "Social App",
    description: "Share posts and connect with friends",
    icon: "Users",
    tags: ["social", "feed", "community"],
    complexity: "advanced",
    isPremium: true,
  },
  {
    id: "restaurant-booking",
    name: "Restaurant Booking",
    description: "Reserve tables at restaurants",
    icon: "UtensilsCrossed",
    tags: ["food", "booking", "restaurant"],
    complexity: "intermediate",
    isPremium: false,
  },
  {
    id: "finance-tracker",
    name: "Finance Tracker",
    description: "Track income expenses and budgets",
    icon: "TrendingUp",
    tags: ["finance", "budget", "money"],
    complexity: "intermediate",
    isPremium: true,
  },
  {
    id: "meditation-app",
    name: "Meditation App",
    description: "Guided meditation and mindfulness",
    icon: "Brain",
    tags: ["wellness", "meditation", "calm"],
    complexity: "beginner",
    isPremium: false,
  },
  {
    id: "marketplace",
    name: "Marketplace",
    description: "Buy and sell items in your community",
    icon: "ShoppingBag",
    tags: ["commerce", "marketplace", "shop"],
    complexity: "advanced",
    isPremium: true,
  },
];

export const ROUTES = {
  home: "/",
  pricing: "/pricing",
  login: "/login",
  signup: "/signup",
  dashboard: "/dashboard",
  generate: "/generate",
  projects: "/projects",
  settings: "/settings",
  billing: "/billing",
} as const;
