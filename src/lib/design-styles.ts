// A curated catalog of design directions the generator can choose from so that
// two different app ideas don't look identical. Tokens are color-agnostic
// (brand colors are injected by the renderer for hero/accent treatments); each
// style differs in surface, radius, borders, typography, and background tone.

export type HeroTreatment = "gradient" | "glass" | "outline" | "solid";

export interface DesignStyleTokens {
  id: string;
  name: string;
  /** One-line hint shown to the model so it can pick the right tone. */
  description: string;
  /** CSS background applied to the device screen. */
  screenBg: string;
  /** CSS background applied to content cards. */
  cardBg: string;
  /** CSS border color for cards. */
  cardBorder: string;
  /** Card corner radius in px. */
  radius: number;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  /** Divider/hairline color. */
  divider: string;
  /** Whether section headings render in uppercase tracking. */
  uppercaseHeadings: boolean;
  /** How the hero block is rendered. */
  hero: HeroTreatment;
}

export const DESIGN_STYLES: DesignStyleTokens[] = [
  {
    id: "aurora-glass",
    name: "Aurora Glass",
    description: "Deep navy with translucent frosted cards and soft gradients — modern, premium, calm.",
    screenBg: "radial-gradient(circle at 20% 0%, rgba(56,70,140,0.35), transparent 55%), linear-gradient(180deg, #0a0f24 0%, #060911 100%)",
    cardBg: "rgba(255,255,255,0.06)",
    cardBorder: "rgba(255,255,255,0.12)",
    radius: 24,
    textPrimary: "#f8fafc",
    textSecondary: "rgba(226,232,240,0.78)",
    textMuted: "rgba(148,163,184,0.7)",
    divider: "rgba(255,255,255,0.08)",
    uppercaseHeadings: false,
    hero: "glass",
  },
  {
    id: "midnight-luxe",
    name: "Midnight Luxe",
    description: "Near-black canvas, hairline borders, refined and high-end — fintech, premium services.",
    screenBg: "linear-gradient(180deg, #0b0b0f 0%, #050507 100%)",
    cardBg: "rgba(20,20,26,0.85)",
    cardBorder: "rgba(212,175,120,0.18)",
    radius: 18,
    textPrimary: "#fdfdfd",
    textSecondary: "rgba(220,220,225,0.75)",
    textMuted: "rgba(150,150,160,0.65)",
    divider: "rgba(255,255,255,0.06)",
    uppercaseHeadings: true,
    hero: "gradient",
  },
  {
    id: "brutalist-mono",
    name: "Brutalist Mono",
    description: "Pure black, sharp corners, high-contrast outlines, uppercase — bold, editorial, statement apps.",
    screenBg: "#000000",
    cardBg: "rgba(255,255,255,0.02)",
    cardBorder: "rgba(255,255,255,0.85)",
    radius: 4,
    textPrimary: "#ffffff",
    textSecondary: "rgba(255,255,255,0.75)",
    textMuted: "rgba(255,255,255,0.45)",
    divider: "rgba(255,255,255,0.25)",
    uppercaseHeadings: true,
    hero: "outline",
  },
  {
    id: "soft-pastel",
    name: "Soft Pastel",
    description: "Light lavender background, white cards, gentle shadows, dark text — friendly, wellness, lifestyle.",
    screenBg: "linear-gradient(180deg, #f3f0fb 0%, #eef2fb 100%)",
    cardBg: "#ffffff",
    cardBorder: "rgba(15,23,42,0.06)",
    radius: 22,
    textPrimary: "#1e1b2e",
    textSecondary: "rgba(40,38,60,0.72)",
    textMuted: "rgba(80,78,100,0.55)",
    divider: "rgba(15,23,42,0.08)",
    uppercaseHeadings: false,
    hero: "gradient",
  },
  {
    id: "neo-cyber",
    name: "Neo Cyber",
    description: "Black with neon glow borders and gradient accents — gaming, web3, tech-forward.",
    screenBg: "radial-gradient(circle at 80% 10%, rgba(0,255,200,0.12), transparent 50%), #05070a",
    cardBg: "rgba(10,16,22,0.9)",
    cardBorder: "rgba(0,229,255,0.35)",
    radius: 14,
    textPrimary: "#eafdff",
    textSecondary: "rgba(180,235,245,0.78)",
    textMuted: "rgba(120,170,185,0.6)",
    divider: "rgba(0,229,255,0.18)",
    uppercaseHeadings: true,
    hero: "gradient",
  },
  {
    id: "editorial-warm",
    name: "Editorial Warm",
    description: "Warm charcoal, generous spacing, calm and content-first — reading, journaling, news.",
    screenBg: "linear-gradient(180deg, #1a1614 0%, #100c0a 100%)",
    cardBg: "rgba(40,33,30,0.7)",
    cardBorder: "rgba(225,200,180,0.12)",
    radius: 20,
    textPrimary: "#f7f1ea",
    textSecondary: "rgba(225,212,200,0.78)",
    textMuted: "rgba(170,155,145,0.6)",
    divider: "rgba(225,200,180,0.1)",
    uppercaseHeadings: false,
    hero: "solid",
  },
  {
    id: "sunset-warm",
    name: "Sunset Glow",
    description: "Dark plum with warm sunset gradients — vibrant, social, creative apps.",
    screenBg: "radial-gradient(circle at 0% 100%, rgba(255,120,90,0.18), transparent 50%), linear-gradient(180deg, #1a0f1f 0%, #0c0710 100%)",
    cardBg: "rgba(40,24,42,0.7)",
    cardBorder: "rgba(255,160,140,0.16)",
    radius: 24,
    textPrimary: "#fdf2f0",
    textSecondary: "rgba(245,220,215,0.78)",
    textMuted: "rgba(190,160,160,0.6)",
    divider: "rgba(255,160,140,0.12)",
    uppercaseHeadings: false,
    hero: "gradient",
  },
  {
    id: "forest-calm",
    name: "Forest Calm",
    description: "Deep green-black, organic rounded surfaces, muted — nature, mindfulness, health.",
    screenBg: "linear-gradient(180deg, #0c1512 0%, #060b09 100%)",
    cardBg: "rgba(20,34,28,0.75)",
    cardBorder: "rgba(120,200,160,0.14)",
    radius: 26,
    textPrimary: "#eef7f1",
    textSecondary: "rgba(210,232,220,0.78)",
    textMuted: "rgba(140,175,155,0.6)",
    divider: "rgba(120,200,160,0.1)",
    uppercaseHeadings: false,
    hero: "glass",
  },
  {
    id: "arctic-clean",
    name: "Arctic Clean",
    description: "Light gray-blue, crisp white cards, dark text — productivity, business, dashboards.",
    screenBg: "linear-gradient(180deg, #eef2f7 0%, #e4eaf2 100%)",
    cardBg: "#ffffff",
    cardBorder: "rgba(15,23,42,0.08)",
    radius: 16,
    textPrimary: "#0f1b2d",
    textSecondary: "rgba(30,45,70,0.72)",
    textMuted: "rgba(70,90,120,0.55)",
    divider: "rgba(15,23,42,0.08)",
    uppercaseHeadings: false,
    hero: "solid",
  },
  {
    id: "mono-slate",
    name: "Mono Slate",
    description: "Cool slate surfaces, minimal and restrained — utilities, tools, developer apps.",
    screenBg: "linear-gradient(180deg, #14181f 0%, #0c0f14 100%)",
    cardBg: "rgba(30,37,48,0.8)",
    cardBorder: "rgba(148,163,184,0.16)",
    radius: 14,
    textPrimary: "#f1f5f9",
    textSecondary: "rgba(203,213,225,0.78)",
    textMuted: "rgba(130,145,165,0.6)",
    divider: "rgba(148,163,184,0.12)",
    uppercaseHeadings: true,
    hero: "outline",
  },
  {
    id: "vibrant-pop",
    name: "Vibrant Pop",
    description: "Dark base with punchy saturated accents and bold headings — youth, entertainment, music.",
    screenBg: "linear-gradient(180deg, #120a1f 0%, #0a0612 100%)",
    cardBg: "rgba(28,18,46,0.78)",
    cardBorder: "rgba(180,120,255,0.22)",
    radius: 22,
    textPrimary: "#f7f0ff",
    textSecondary: "rgba(225,210,245,0.8)",
    textMuted: "rgba(170,150,200,0.6)",
    divider: "rgba(180,120,255,0.14)",
    uppercaseHeadings: true,
    hero: "gradient",
  },
  {
    id: "claymorphic",
    name: "Claymorphic",
    description: "Soft puffy dark clay surfaces, very rounded — playful, kids, casual apps.",
    screenBg: "linear-gradient(180deg, #1b1d2e 0%, #11121d 100%)",
    cardBg: "rgba(45,48,72,0.85)",
    cardBorder: "rgba(255,255,255,0.06)",
    radius: 30,
    textPrimary: "#f4f5ff",
    textSecondary: "rgba(215,218,240,0.8)",
    textMuted: "rgba(155,160,195,0.6)",
    divider: "rgba(255,255,255,0.06)",
    uppercaseHeadings: false,
    hero: "glass",
  },
  {
    id: "deep-ocean",
    name: "Deep Ocean",
    description: "Dark teal-blue with cool gradients — travel, finance, calm productivity.",
    screenBg: "radial-gradient(circle at 50% 0%, rgba(20,120,160,0.25), transparent 55%), linear-gradient(180deg, #06121c 0%, #030a12 100%)",
    cardBg: "rgba(12,28,40,0.78)",
    cardBorder: "rgba(80,180,210,0.16)",
    radius: 20,
    textPrimary: "#eaf6fb",
    textSecondary: "rgba(200,228,238,0.78)",
    textMuted: "rgba(130,170,185,0.6)",
    divider: "rgba(80,180,210,0.12)",
    uppercaseHeadings: false,
    hero: "gradient",
  },
  {
    id: "rose-noir",
    name: "Rosé Noir",
    description: "Charcoal with rose-gold accents, elegant and minimal — beauty, fashion, lifestyle.",
    screenBg: "linear-gradient(180deg, #16100f 0%, #0b0807 100%)",
    cardBg: "rgba(34,24,26,0.8)",
    cardBorder: "rgba(232,180,180,0.16)",
    radius: 20,
    textPrimary: "#fbf2f1",
    textSecondary: "rgba(235,210,210,0.78)",
    textMuted: "rgba(180,150,150,0.6)",
    divider: "rgba(232,180,180,0.12)",
    uppercaseHeadings: true,
    hero: "outline",
  },
];

const DEFAULT_STYLE_ID = "aurora-glass";

const STYLE_MAP: Record<string, DesignStyleTokens> = Object.fromEntries(
  DESIGN_STYLES.map((style) => [style.id, style]),
);

export function resolveDesignStyle(id?: string | null): DesignStyleTokens {
  if (id && STYLE_MAP[id]) return STYLE_MAP[id];
  return STYLE_MAP[DEFAULT_STYLE_ID];
}

export function listDesignStyleChoices(): string {
  return DESIGN_STYLES.map((s) => `- ${s.id}: ${s.description}`).join("\n");
}

export function getDesignStyleIds(): string[] {
  return DESIGN_STYLES.map((s) => s.id);
}

/** Heuristic default style per domain, used for fallbacks. */
export function defaultStyleForDomain(domain: string): string {
  switch (domain) {
    case "finance":
      return "deep-ocean";
    case "fitness":
      return "vibrant-pop";
    case "restaurant":
      return "editorial-warm";
    case "commerce":
      return "arctic-clean";
    case "travel":
      return "deep-ocean";
    case "social":
      return "sunset-warm";
    default:
      return DEFAULT_STYLE_ID;
  }
}
