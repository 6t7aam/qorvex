"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Sparkles, X } from "lucide-react";
import type { ClarifyQuestion } from "@/app/api/generate/clarify/route";

interface ClarifyModalProps {
  open: boolean;
  loading: boolean;
  questions: ClarifyQuestion[];
  onClose: () => void;
  // answersText is a formatted block appended to the prompt. Empty when skipped.
  onConfirm: (answersText: string) => void;
}

type AnswerState = Record<string, { options: string[]; note: string }>;

function buildAnswersText(
  questions: ClarifyQuestion[],
  answers: AnswerState,
): string {
  const lines: string[] = [];
  for (const question of questions) {
    const answer = answers[question.id];
    if (!answer) continue;
    const parts = [...answer.options];
    if (answer.note.trim()) parts.push(answer.note.trim());
    if (parts.length === 0) continue;
    lines.push(`- ${question.question} ${parts.join(", ")}`);
  }
  if (lines.length === 0) return "";
  return `\n\nAdditional product details from the user:\n${lines.join("\n")}`;
}

export function ClarifyModal({
  open,
  loading,
  questions,
  onClose,
  onConfirm,
}: ClarifyModalProps) {
  const [answers, setAnswers] = useState<AnswerState>({});

  function toggleOption(question: ClarifyQuestion, option: string) {
    setAnswers((prev) => {
      const current = prev[question.id] ?? { options: [], note: "" };
      let nextOptions: string[];
      if (question.allowMultiple) {
        nextOptions = current.options.includes(option)
          ? current.options.filter((o) => o !== option)
          : [...current.options, option];
      } else {
        nextOptions = current.options.includes(option) ? [] : [option];
      }
      return { ...prev, [question.id]: { ...current, options: nextOptions } };
    });
  }

  function setNote(question: ClarifyQuestion, note: string) {
    setAnswers((prev) => {
      const current = prev[question.id] ?? { options: [], note: "" };
      return { ...prev, [question.id]: { ...current, note } };
    });
  }

  const answeredCount = questions.filter((q) => {
    const a = answers[q.id];
    return a && (a.options.length > 0 || a.note.trim().length > 0);
  }).length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-background-secondary shadow-2xl shadow-black/60"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/5 px-6 py-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-200">
                  <Sparkles className="h-3 w-3" />
                  Refine before building
                </div>
                <h2 className="mt-3 text-xl font-semibold text-white">
                  A few quick details
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Answer what matters — Qorvex uses these to build a sharper,
                  more specific app. You can skip anything.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-2 text-text-muted transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-text-secondary">
                  <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
                  <span className="text-sm">
                    Thinking about the best questions to ask…
                  </span>
                </div>
              ) : questions.length === 0 ? (
                <div className="py-12 text-center text-sm text-text-secondary">
                  No extra questions needed — let&apos;s build it.
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((question, qi) => {
                    const answer = answers[question.id];
                    return (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: qi * 0.05, duration: 0.3 }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-semibold text-white">
                            {question.question}
                          </h3>
                          {question.allowMultiple && (
                            <span className="shrink-0 text-[10px] uppercase tracking-wider text-text-muted">
                              Select any
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {question.options.map((option) => {
                            const selected = answer?.options.includes(option);
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => toggleOption(question, option)}
                                className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                                  selected
                                    ? "border-violet-400/50 bg-violet-500/20 text-white"
                                    : "border-white/10 bg-white/[0.03] text-text-secondary hover:border-white/20 hover:text-white"
                                }`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                        <input
                          type="text"
                          value={answer?.note ?? ""}
                          onChange={(e) => setNote(question, e.target.value)}
                          placeholder="Add your own detail (optional)"
                          className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-2 text-sm text-white placeholder:text-text-muted/60 focus:border-violet-400/40 focus:outline-none"
                        />
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-white/5 px-6 py-4">
              <button
                type="button"
                onClick={() => onConfirm("")}
                className="text-sm font-medium text-text-secondary transition hover:text-white"
              >
                Skip &amp; build
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => onConfirm(buildAnswersText(questions, answers))}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(124,58,237,0.4)] transition hover:from-violet-400 hover:to-cyan-400 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                Build my app
                {answeredCount > 0 ? ` (${answeredCount})` : ""}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
