"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Maximize2, QrCode } from "lucide-react";
import { useUIStore } from "@/stores/useUIStore";
import {
  getProjectPreviewModel,
  getTabLabelsFromPreview,
  type ProjectPreviewModel,
  type ProjectPreviewScreen,
  type ProjectPreviewSection,
} from "@/lib/project-artifacts";

interface MobilePreviewProps {
  generatedFiles: Record<string, string>;
  projectName: string;
  projectPrompt?: string;
  colors: { primary: string; secondary: string; accent: string };
  isUpdating?: boolean;
  compact?: boolean;
}

const SCREEN_VARIANTS = {
  enter: (d: number) => ({ opacity: 0, x: d >= 0 ? 30 : -30 }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: d >= 0 ? -26 : 26 }),
};

const SECTION_LIST_VARIANTS = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const SECTION_ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
} as const;

type PreviewItem = Record<string, string | number>;

function isPreviewItem(value: unknown): value is PreviewItem {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getStringField(
  value: unknown,
  fields: string[],
  fallback: string,
): string {
  if (!isPreviewItem(value)) return fallback;

  for (const field of fields) {
    const candidate = value[field];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
    if (typeof candidate === "number") {
      return String(candidate);
    }
  }

  return fallback;
}

function getScreenKey(screen: ProjectPreviewScreen, index: number) {
  return `${getStringField(screen, ["id", "title"], "screen")}-${index}`;
}

function getSectionKey(section: ProjectPreviewSection, index: number) {
  return `${getStringField(section, ["id", "title"], "section")}-${index}`;
}

function getTabKey(tab: string, index: number) {
  return `${tab || "tab"}-${index}`;
}

function getPreviewItems(items: ProjectPreviewSection["items"]) {
  if (!Array.isArray(items)) return [];
  return items.filter(isPreviewItem);
}

function getPreviewItemKey(
  section: ProjectPreviewSection,
  item: PreviewItem,
  index: number,
) {
  const sectionKey = getStringField(section, ["id", "title"], "section");
  const itemKey = getStringField(item, ["id", "title", "label"], "item");
  return `${sectionKey}-${itemKey}-${index}`;
}

export function MobilePreview({
  generatedFiles,
  projectName,
  projectPrompt,
  colors,
  isUpdating = false,
  compact = false,
}: MobilePreviewProps) {
  const device = useUIStore((state) => state.previewDevice);
  const setDevice = useUIStore((state) => state.setPreviewDevice);

  const preview = useMemo(
    () =>
      getProjectPreviewModel({
        files: generatedFiles,
        projectName,
        prompt: projectPrompt,
        colors,
      }),
    [colors, generatedFiles, projectName, projectPrompt],
  );

  const screens = preview.screens.slice(0, 6);
  const [screenIndex, setScreenIndex] = useState(0);
  // Track navigation direction so screen transitions slide the natural way.
  const [direction, setDirection] = useState(0);
  const prevIndexRef = useRef(0);

  const safeScreenIndex = screenIndex < screens.length ? screenIndex : 0;

  function goToScreen(index: number) {
    setDirection(index > prevIndexRef.current ? 1 : index < prevIndexRef.current ? -1 : 0);
    prevIndexRef.current = index;
    setScreenIndex(index);
  }

  // Brief flash so the user can see "something just updated" even when screen
  // titles stay the same across an edit. Triggers whenever generatedFiles
  // changes reference *or* whenever the parent reports an update in progress.
  const [justUpdated, setJustUpdated] = useState(false);
  const filesRef = useRef(generatedFiles);
  useEffect(() => {
    if (filesRef.current === generatedFiles) return;
    filesRef.current = generatedFiles;
    setJustUpdated(true);
    const timer = window.setTimeout(() => setJustUpdated(false), 900);
    return () => window.clearTimeout(timer);
  }, [generatedFiles]);

  const activeScreen = screens[safeScreenIndex] ?? screens[0];
  const tabs = getTabLabelsFromPreview(preview).slice(0, 5);

  return (
    <div
      className={`flex h-full min-h-0 w-full flex-col items-center ${
        compact ? "gap-3" : "gap-4 lg:gap-5"
      }`}
    >
      <div className={`flex w-full flex-col items-center ${compact ? "gap-2" : "gap-3"}`}>
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.02] p-1">
          {(["ios", "android"] as const).map((platform) => (
            <button
              key={platform}
              type="button"
              onClick={() => setDevice(platform)}
              className={`rounded-full px-4 py-1 text-xs font-medium uppercase tracking-wider transition ${
                device === platform
                  ? "bg-violet-500/20 text-white"
                  : "text-text-secondary hover:text-white"
              }`}
            >
              {platform === "ios" ? "iOS" : "Android"}
            </button>
          ))}
        </div>

        {screens.length > 1 && (
          <div
            className={`flex max-w-full items-center justify-center gap-2 ${
              compact
                ? "w-full overflow-x-auto whitespace-nowrap pb-1"
                : "flex-wrap"
            }`}
          >
            {screens.map((screen, index) => (
              <button
                key={getScreenKey(screen, index)}
                type="button"
                onClick={() => goToScreen(index)}
                className="relative shrink-0 rounded-full px-3 py-1 text-xs font-medium transition"
              >
                {index === safeScreenIndex && (
                  <motion.span
                    layoutId="preview-tab-active"
                    className="absolute inset-0 rounded-full bg-white/12"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <span
                  className={`relative z-10 ${
                    index === safeScreenIndex
                      ? "text-white"
                      : "text-text-secondary hover:text-white"
                  }`}
                >
                  {screen.title}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex min-h-0 w-full flex-1 items-center justify-center py-1">
        <motion.div
          key={device}
          initial={{ rotateY: 24, opacity: 0, scale: 0.96 }}
          animate={{ rotateY: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformPerspective: 1400 }}
          className="flex h-full max-h-full items-center justify-center"
        >
          <PhoneFrame
            device={device}
            isUpdating={isUpdating || justUpdated}
            background={preview.theme.background}
            compact={compact}
          >
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              {activeScreen ? (
                <motion.div
                  key={activeScreen.id}
                  custom={direction}
                  variants={SCREEN_VARIANTS}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full w-full"
                >
                  <PreviewScreen
                    preview={preview}
                    screen={activeScreen}
                    tabs={tabs}
                    colors={colors}
                    onSelectTab={(title) => {
                      const idx = screens.findIndex(
                        (s) => s.title.toLowerCase() === title.toLowerCase(),
                      );
                      if (idx >= 0) goToScreen(idx);
                    }}
                  />
                </motion.div>
              ) : (
                <EmptyPreview />
              )}
            </AnimatePresence>
          </PhoneFrame>
        </motion.div>
      </div>

      {!compact && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="glass-border inline-flex items-center gap-2 rounded-xl bg-white/[0.02] px-4 py-2 text-sm text-white transition hover:bg-white/[0.06]"
          >
            <QrCode className="h-4 w-4" />
            Expo Go soon
          </button>
          <button
            type="button"
            className="glass-border inline-flex items-center gap-2 rounded-xl bg-white/[0.02] px-4 py-2 text-sm text-white transition hover:bg-white/[0.06]"
          >
            <Maximize2 className="h-4 w-4" />
            Full screen soon
          </button>
        </div>
      )}
    </div>
  );
}

function PhoneFrame({
  device,
  children,
  isUpdating = false,
  background,
  compact = false,
}: {
  device: "ios" | "android";
  children: React.ReactNode;
  isUpdating?: boolean;
  background?: string;
  compact?: boolean;
}) {
  const radius = device === "ios" ? "rounded-[44px]" : "rounded-[28px]";
  const innerRadius = device === "ios" ? "rounded-[36px]" : "rounded-[20px]";
  const innerBackground = background && background.trim() ? background : "#0b1020";

  return (
    <div
      className={`relative w-auto max-h-full max-w-full aspect-[280/580] ${compact ? "h-full max-h-[48rem]" : "h-[min(72vh,44rem)]"} ${radius} border bg-background-secondary p-2.5 shadow-2xl shadow-black/60 transition-all duration-300 ${
        isUpdating
          ? "border-violet-400/60 shadow-violet-500/30"
          : "border-white/10"
      }`}
    >
      <div
        className={`relative h-full w-full overflow-hidden ${innerRadius}`}
        style={{ background: innerBackground }}
      >
        {device === "ios" ? (
          <div className="absolute left-1/2 top-2 h-1.5 w-20 -translate-x-1/2 rounded-full bg-black/70" />
        ) : (
          <div className="absolute left-1/2 top-3 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-black/80" />
        )}
        <div className="relative h-full w-full pt-9">{children}</div>

        <AnimatePresence>
          {isUpdating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-none absolute inset-0 flex items-end justify-center bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_55%)] ${innerRadius}`}
            >
              <div className="mb-3 flex items-center gap-2 rounded-full border border-violet-400/40 bg-black/55 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-violet-100 backdrop-blur">
                <Loader2 className="h-3 w-3 animate-spin text-violet-300" />
                Updating preview
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PreviewScreen({
  preview,
  screen,
  tabs,
  colors,
  onSelectTab,
}: {
  preview: ProjectPreviewModel;
  screen: ProjectPreviewScreen;
  tabs: string[];
  colors: { primary: string; secondary: string; accent: string };
  onSelectTab?: (title: string) => void;
}) {
  const sections =
    screen.sections.length > 0
      ? screen.sections
      : [
          {
            type: "empty" as const,
            title: "Preview building",
            body: "Qorvex is preparing this screen's content.",
            cta: "Generate details",
          },
        ];

  return (
    <div
      className="flex h-full flex-col"
      style={{
        background:
          preview.theme.background ||
          "linear-gradient(180deg, rgba(18,24,45,1) 0%, rgba(8,11,24,1) 100%)",
      }}
    >
      <div className="px-4 pb-2">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-white/55">
          <span>{preview.appName}</span>
          <span>{screen.title}</span>
        </div>
        <h3 className="mt-2 text-lg font-semibold text-white">{screen.title}</h3>
        {screen.subtitle && (
          <p className="mt-1 text-xs leading-relaxed text-white/65">
            {screen.subtitle}
          </p>
        )}
      </div>

      <motion.div
        key={screen.id}
        variants={SECTION_LIST_VARIANTS}
        initial="hidden"
        animate="show"
        className="flex-1 space-y-3 overflow-y-auto px-4 pb-4"
      >
        {sections.map((section, index) => (
          <motion.div
            key={getSectionKey(section, index)}
            variants={SECTION_ITEM_VARIANTS}
          >
            <SectionCard section={section} colors={colors} />
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-auto border-t border-white/5 bg-black/30 px-4 py-2.5">
        <div className="flex items-center justify-around">
          {tabs.map((tab, index) => {
            const active =
              screen.title.toLowerCase() === tab.toLowerCase() ||
              (index === 0 &&
                !tabs.some(
                  (t) => t.toLowerCase() === screen.title.toLowerCase(),
                ));
            return (
              <button
                key={getTabKey(tab, index)}
                type="button"
                onClick={() => onSelectTab?.(tab)}
                className="flex flex-col items-center gap-1 transition active:scale-90"
              >
                <motion.div
                  className="h-2 w-2 rounded-full"
                  animate={{
                    backgroundColor: active
                      ? colors.primary
                      : "rgba(255,255,255,0.22)",
                    scale: active ? 1.25 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                />
                <span
                  className={`text-[9px] uppercase tracking-wider transition-colors ${
                    active ? "text-white/85" : "text-white/40"
                  }`}
                >
                  {tab}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  section,
  colors,
}: {
  section: ProjectPreviewSection;
  colors: { primary: string; secondary: string; accent: string };
}) {
  const items = getPreviewItems(section.items);

  if (section.type === "hero") {
    return (
      <div
        className="rounded-3xl p-4 text-white shadow-xl"
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
        }}
      >
        <div className="text-[10px] uppercase tracking-[0.25em] text-white/70">
          {section.title}
        </div>
        {section.value && (
          <div className="mt-2 text-2xl font-semibold">{section.value}</div>
        )}
        {section.body && (
          <p className="mt-2 text-xs leading-relaxed text-white/80">
            {section.body}
          </p>
        )}
      </div>
    );
  }

  if (section.type === "stats") {
    const statItems = items.slice(0, 3);
    return (
      <div className="rounded-3xl border border-white/6 bg-white/[0.035] p-4">
        <div className="text-sm font-medium text-white">{section.title}</div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {statItems.length > 0 ? statItems.map((item, index) => (
            <div
              key={getPreviewItemKey(section, item, index)}
              className="rounded-2xl bg-black/20 p-3"
            >
              <div className="text-[10px] uppercase tracking-wide text-white/45">
                {getStringField(item, ["label", "title"], "Metric")}
              </div>
              <div className="mt-1 text-sm font-semibold text-white">
                {getStringField(item, ["value", "amount"], "--")}
              </div>
              {"change" in item && (
                <div className="mt-1 text-[10px] text-emerald-300">
                  {String(item.change)}
                </div>
              )}
            </div>
          )) : (
            <div className="col-span-3 rounded-2xl bg-black/20 p-3 text-xs text-white/55">
              Metrics will appear here when preview data is available.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (section.type === "chart") {
    const points = items.slice(0, 5);
    const maxValue = Math.max(
      1,
      ...points.map((point) => Number(point.value ?? 0)),
    );

    return (
      <div className="rounded-3xl border border-white/6 bg-white/[0.035] p-4">
        <div className="text-sm font-medium text-white">{section.title}</div>
        <div className="mt-4 flex h-28 items-end gap-2">
          {points.length > 0 ? points.map((point, index) => {
            const value = Number(point.value ?? 0);
            const height = `${Math.max(18, (value / maxValue) * 100)}%`;
            return (
              <div
                key={getPreviewItemKey(section, point, index)}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <motion.div
                  className="w-full origin-bottom rounded-t-xl"
                  initial={{ scaleY: 0, opacity: 0.4 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    height,
                    background:
                      index % 2 === 0
                        ? colors.primary
                        : colors.secondary,
                  }}
                />
                <span className="text-[10px] text-white/45">
                  {getStringField(point, ["label", "title"], "Point")}
                </span>
              </div>
            );
          }) : (
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-black/20 text-xs text-white/50">
              Chart data is loading for this preview.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (section.type === "actions") {
    return (
      <div className="rounded-3xl border border-white/6 bg-white/[0.035] p-4">
        <div className="text-sm font-medium text-white">{section.title}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {items.length > 0 ? items.slice(0, 4).map((item, index) => (
            <span
              key={getPreviewItemKey(section, item, index)}
              className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] text-white/80"
            >
              {getStringField(item, ["label", "title", "value"], "Action")}
            </span>
          )) : (
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] text-white/55">
              Actions will appear here
            </span>
          )}
        </div>
      </div>
    );
  }

  if (section.type === "empty") {
    return (
      <div className="rounded-3xl border border-dashed border-white/12 bg-white/[0.02] p-4 text-center">
        <div className="text-sm font-medium text-white">{section.title}</div>
        {section.body && (
          <p className="mt-2 text-xs leading-relaxed text-white/55">
            {section.body}
          </p>
        )}
        {section.cta && (
          <div className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/80">
            {section.cta}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/6 bg-white/[0.035] p-4">
      <div className="text-sm font-medium text-white">{section.title}</div>
      {section.body && (
        <p className="mt-2 text-xs leading-relaxed text-white/60">
          {section.body}
        </p>
      )}
      <div className="mt-3 space-y-2">
        {items.length > 0 ? items.slice(0, 4).map((item, index) => (
          <div
            key={getPreviewItemKey(section, item, index)}
            className="rounded-2xl bg-black/20 px-3 py-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-medium text-white">
                  {getStringField(item, ["title", "label"], "Item")}
                </div>
                {"subtitle" in item && (
                  <div className="text-[10px] text-white/45">
                    {String(item.subtitle)}
                  </div>
                )}
              </div>
              {"value" in item && (
                <div className="text-xs font-semibold text-white">
                  {String(item.value)}
                </div>
              )}
            </div>
          </div>
        )) : (
          <div className="rounded-2xl bg-black/20 px-3 py-2 text-xs text-white/55">
            No items available for this section yet.
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyPreview() {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/60">
      Generate a project to see the in-app preview.
    </div>
  );
}
