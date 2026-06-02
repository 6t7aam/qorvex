import { NextResponse, type NextRequest } from "next/server";
import { getAIProvider } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/with-timeout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ClarifyBody {
  prompt: string;
  templateId?: string | null;
  features?: string[];
}

export interface ClarifyQuestion {
  id: string;
  question: string;
  options: string[];
  allowMultiple: boolean;
}

const SYSTEM_PROMPT = `You are a senior product discovery partner helping turn a one-line app idea into a focused brief before a generator builds it.
Ask only the questions whose answers would most change the design — audience, the core job-to-be-done, the must-have screens, the visual tone, and key data the app revolves around.
Return exactly one valid JSON object, no prose, no markdown.`;

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    questions: {
      type: "array",
      minItems: 3,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          question: { type: "string" },
          allowMultiple: { type: "boolean" },
          options: {
            type: "array",
            minItems: 3,
            maxItems: 5,
            items: { type: "string" },
          },
        },
        required: ["question", "allowMultiple", "options"],
      },
    },
  },
  required: ["questions"],
};

function cleanJson(raw: string) {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function parseQuestions(raw: string): ClarifyQuestion[] {
  const cleaned = cleanJson(raw);
  const candidates = [cleaned];
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) candidates.push(cleaned.slice(start, end + 1));

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as {
        questions?: Array<{
          question?: unknown;
          options?: unknown;
          allowMultiple?: unknown;
        }>;
      };
      if (!Array.isArray(parsed.questions)) continue;

      const questions = parsed.questions
        .map((entry, index): ClarifyQuestion | null => {
          if (typeof entry.question !== "string" || !entry.question.trim()) {
            return null;
          }
          const options = Array.isArray(entry.options)
            ? entry.options
                .filter(
                  (option): option is string =>
                    typeof option === "string" && option.trim().length > 0,
                )
                .map((option) => option.trim())
                .slice(0, 5)
            : [];
          if (options.length < 2) return null;
          return {
            id: `q-${index}`,
            question: entry.question.trim(),
            options,
            allowMultiple: entry.allowMultiple === true,
          };
        })
        .filter((entry): entry is ClarifyQuestion => Boolean(entry))
        .slice(0, 4);

      if (questions.length > 0) return questions;
    } catch {}
  }

  return [];
}

export async function POST(request: NextRequest) {
  let provider: ReturnType<typeof getAIProvider>;
  try {
    provider = getAIProvider();
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "AI provider is not configured.",
      },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ClarifyBody;
  try {
    body = (await request.json()) as ClarifyBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const userPrompt = `App idea: ${prompt.slice(0, 2000)}
Template hint: ${body.templateId ?? "custom"}
Pre-selected features: ${(body.features ?? []).join(", ") || "none"}

Produce 3-4 sharp clarifying questions, each with 3-5 concrete answer options worded as choices a user can tap.
Cover different dimensions (audience, core action, key screens, visual tone, primary data). Set allowMultiple true only when several options can sensibly be combined.`;

  try {
    const result = await withTimeout(
      provider.generateText({
        systemPrompt: SYSTEM_PROMPT,
        prompt: userPrompt,
        maxTokens: 1200,
        temperature: 0.5,
        thinkingBudget: 1024,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      }),
      25000,
      "Clarifying questions timed out.",
    );

    const questions = parseQuestions(result.text);
    if (questions.length === 0) {
      return NextResponse.json({ questions: [] });
    }

    return NextResponse.json({ questions });
  } catch (error) {
    // Clarify is optional — never block generation on its failure.
    return NextResponse.json({
      questions: [],
      error: error instanceof Error ? error.message : "Could not build questions.",
    });
  }
}
