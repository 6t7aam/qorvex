import { NextResponse, type NextRequest } from "next/server";
import { getAIProvider, type AIUsage } from "@/lib/ai";
import {
  CreditChargeError,
  beginAIUsageSession,
  chargeInitialAppGenerationCredits,
  findCreditUsageEvent,
  getDailyCreditSnapshot,
} from "@/lib/ai-usage.server";
import {
  INITIAL_APP_GENERATION_COST,
  INITIAL_APP_GENERATION_EVENT_TYPE,
  getPlanDailyCreditLimit,
} from "@/lib/ai-credits";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { executeGenerationPipeline } from "@/lib/generation-pipeline";
import { getClientIP, hashIP } from "@/lib/ip-hash";
import type { Project, UserProfile } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GenerateBody {
  prompt: string;
  templateId?: string | null;
  colors?: { primary: string; secondary: string; accent: string };
  features?: string[];
  platform?: "ios" | "android" | "both";
  projectName?: string;
  requestId?: string;
}

const DEFAULT_COLORS = {
  primary: "#7c3aed",
  secondary: "#06b6d4",
  accent: "#f59e0b",
};

function createStreamEvent(payload: Record<string, unknown>) {
  return `${JSON.stringify(payload)}\n`;
}

function trimErrorMessage(error: string | null | undefined) {
  if (!error) return null;
  return error.length > 800 ? `${error.slice(0, 797)}...` : error;
}

function aggregateUsage(entries: AIUsage[]) {
  return entries.reduce(
    (acc, entry) => ({
      promptTokens: acc.promptTokens + entry.promptTokens,
      completionTokens: acc.completionTokens + entry.completionTokens,
      totalTokens: acc.totalTokens + entry.totalTokens,
      estimatedCostUsd: acc.estimatedCostUsd + entry.estimatedCostUsd,
      provider: acc.provider || entry.provider,
      model: acc.model || entry.model,
    }),
    {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
      provider: "",
      model: "",
    },
  );
}

function creditsLimitErrorMessage(profile: UserProfile) {
  const limit = getPlanDailyCreditLimit(
    profile.plan,
    profile.abuse_detected ?? false,
  );

  return `You have reached today's AI credit limit for the ${profile.plan.toUpperCase()} plan (${limit.toLocaleString()} credits / day). Credits reset at 00:00 UTC.`;
}

export async function POST(request: NextRequest) {
  try {
    getAIProvider();
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 500 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: GenerateBody;
  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.prompt || typeof body.prompt !== "string") {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const { data: profileData } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single<UserProfile>();

  if (!profileData) {
    return NextResponse.json({ error: "Profile missing" }, { status: 404 });
  }

  if (!profileData.ip_hash) {
    const clientIP = getClientIP(request.headers);
    if (clientIP) {
      const ipHash = hashIP(clientIP);
      const admin = createAdminClient();
      await admin.from("user_profiles").update({ ip_hash: ipHash }).eq("id", user.id);
    }
  }

  const colors = body.colors ?? DEFAULT_COLORS;
  const platform = body.platform ?? "both";
  const features = body.features ?? [];
  const projectName =
    body.projectName?.trim() ||
    body.prompt.split(/\s+/).slice(0, 4).join(" ") ||
    "Untitled app";

  const admin = createAdminClient();
  const provider = getAIProvider();
  const requestId =
    typeof body.requestId === "string" && body.requestId.trim()
      ? body.requestId.trim().slice(0, 160)
      : crypto.randomUUID();

  try {
    const duplicateEvent = await findCreditUsageEvent({
      admin,
      userId: user.id,
      eventType: INITIAL_APP_GENERATION_EVENT_TYPE,
      requestId,
    });

    if (duplicateEvent) {
      return NextResponse.json(
        {
          success: false,
          error: "This generation request is already being processed.",
          projectId: duplicateEvent.project_id,
        },
        { status: 409 },
      );
    }
  } catch (error) {
    console.error("[generate] credit usage event lookup failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Credit tracking is not ready. Please apply the latest Supabase migration.",
      },
      { status: 500 },
    );
  }

  const creditSnapshot = await getDailyCreditSnapshot({
    admin,
    userId: user.id,
    plan: profileData.plan,
    abuseDetected: profileData.abuse_detected ?? false,
  });

  console.info("[generate] initial credit preflight", {
    userId: user.id,
    requestId,
    availableCredits: creditSnapshot.totalAvailableCredits,
    generationCost: INITIAL_APP_GENERATION_COST,
  });

  if (creditSnapshot.totalAvailableCredits < INITIAL_APP_GENERATION_COST) {
    return NextResponse.json(
      {
        success: false,
        error: "Not enough AI credits. Initial app generation costs 2,000 credits.",
      },
      { status: 402 },
    );
  }

  let usageSession:
    | Awaited<ReturnType<typeof beginAIUsageSession>>
    | null = null;

  try {
    usageSession = await beginAIUsageSession({
      admin,
      userId: user.id,
      plan: profileData.plan,
      abuseDetected: profileData.abuse_detected ?? false,
      reserveCredits: INITIAL_APP_GENERATION_COST,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : creditsLimitErrorMessage(profileData);
    const isUpgradeBlock = message.includes("daily AI credits");
    const isQueueBlock =
      message.includes("Another AI request") || message.includes("too quickly");

    return NextResponse.json(
      {
        success: false,
        error: message,
        upgradeRequired: isUpgradeBlock,
        retryable: isQueueBlock,
      },
      { status: isUpgradeBlock ? 402 : isQueueBlock ? 429 : 400 },
    );
  }

  const { data: project, error: projectError } = await admin
    .from("projects")
    .insert({
      user_id: user.id,
      name: projectName,
      description: body.prompt.slice(0, 280),
      prompt: body.prompt,
      status: "generating",
      template_id: body.templateId ?? null,
      app_type: body.templateId ?? "custom",
      colors,
      features,
    })
    .select()
    .single<Project>();

  if (projectError || !project) {
    if (usageSession) {
      try {
        await usageSession.release();
      } catch (error) {
        console.error("[generate] failed to release usage session:", error);
      }
    }
    return NextResponse.json(
      { error: projectError?.message ?? "Could not create project" },
      { status: 500 },
    );
  }

  const { data: generation, error: generationError } = await admin
    .from("generations")
    .insert({
      user_id: user.id,
      project_id: project.id,
      prompt: body.prompt,
      provider: provider.providerId,
      model: provider.model,
      status: "processing",
    })
    .select()
    .single<{ id: string }>();

  if (generationError || !generation) {
    await admin.from("projects").delete().eq("id", project.id);
    if (usageSession) {
      try {
        await usageSession.release();
      } catch (error) {
        console.error("[generate] failed to release usage session:", error);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: generationError?.message ?? "Could not create generation job",
      },
      { status: 500 },
    );
  }

  try {
    const charge = await chargeInitialAppGenerationCredits({
      admin,
      userId: user.id,
      plan: profileData.plan,
      abuseDetected: profileData.abuse_detected ?? false,
      requestId,
      projectId: project.id,
      metadata: {
        generation_id: generation.id,
        source: "api_generate",
      },
    });

    console.info("[generate] initial generation credit charge", {
      userId: user.id,
      requestId,
      projectId: project.id,
      generationId: generation.id,
      cost: INITIAL_APP_GENERATION_COST,
      alreadyCharged: charge.alreadyCharged,
      remainingCredits: charge.snapshot.totalAvailableCredits,
    });
  } catch (error) {
    console.error("[generate] initial generation credit charge failed:", {
      userId: user.id,
      requestId,
      projectId: project.id,
      error,
    });
    await admin.from("projects").delete().eq("id", project.id);
    if (usageSession) {
      try {
        await usageSession.release();
      } catch (releaseError) {
        console.error("[generate] failed to release usage session:", releaseError);
      }
    }

    const message =
      error instanceof Error
        ? error.message
        : "Could not charge initial app generation credits.";
    const status = error instanceof CreditChargeError ? error.status : 500;

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status },
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let finalFiles: Record<string, string> | null = null;
      let finalPreview: unknown = null;
      let finalWarnings: string[] = [];
      let fatalError: string | null = null;
      const usageEntries: AIUsage[] = [];

      const writeEvent = (payload: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(createStreamEvent(payload)));
        } catch {}
      };

      try {
        const result = await executeGenerationPipeline(
          {
            prompt: body.prompt,
            projectName,
            templateId: body.templateId ?? null,
            colors,
            features,
            platform,
          },
          (event) => {
            writeEvent({
              type: "progress",
              ...event,
            });
          },
          (message) => {
            writeEvent({
              type: "notice",
              message,
            });
          },
          {
            ensureStageBudget: async (stageName, prompt, maxTokens) => {
              return usageSession!.ensureCreditsAvailable(
                provider.estimateUsage({
                  prompt,
                  maxTokens,
                }).creditsUsed,
                stageName,
              );
            },
            onUsage: async (usage) => {
              usageEntries.push(usage);
              await usageSession!.recordTokenUsage(usage);
            },
          },
        );

        finalFiles = result.files;
        finalPreview = result.preview;
        finalWarnings = result.warnings;
        const usageTotals = aggregateUsage(result.usage);

        const { error: projectUpdateError } = await admin
          .from("projects")
          .update({
            status: "ready",
            generated_code: result.files,
          })
          .eq("id", project.id);

        if (projectUpdateError) {
          throw new Error(projectUpdateError.message);
        }

        if (generation?.id) {
          const { error: generationUpdateError } = await admin
            .from("generations")
            .update({
              status: result.partial ? "failed" : "completed",
              provider: usageTotals.provider || getAIProvider().providerId,
              model: usageTotals.model || getAIProvider().model,
              prompt_tokens: usageTotals.promptTokens,
              completion_tokens: usageTotals.completionTokens,
              tokens_used: usageTotals.totalTokens,
              estimated_cost_usd: usageTotals.estimatedCostUsd,
              error:
                result.warnings.length > 0
                  ? trimErrorMessage(result.warnings.join(" | "))
                  : null,
            })
            .eq("id", generation.id);

          if (generationUpdateError) {
            console.error(
              `[generate] generation update failed for ${generation.id}:`,
              generationUpdateError,
            );
          }
        }

        const { error: versionError } = await admin.from("app_versions").insert({
          project_id: project.id,
          version_number: 1,
          prompt: body.prompt,
          generated_code: result.files,
        });

        if (versionError) {
          console.error(
            `[generate] app version insert failed for project ${project.id}:`,
            versionError,
          );
        }

        writeEvent({
          type: "result",
          projectId: project.id,
          files: result.files,
          preview: result.preview,
          partial: result.partial,
          warnings: result.warnings,
        });
      } catch (error) {
        fatalError = error instanceof Error ? error.message : "Generation failed";
        console.error(`[generate] staged generation failed for ${project.id}:`, error);
        const usageTotals = aggregateUsage(usageEntries);

        if (finalFiles) {
          await admin
            .from("projects")
            .update({
              status: "ready",
              generated_code: finalFiles,
            })
            .eq("id", project.id);
        } else {
          await admin.from("projects").update({ status: "error" }).eq("id", project.id);
        }

        if (generation?.id) {
          await admin
            .from("generations")
            .update({
              status: "failed",
              provider: usageTotals.provider || null,
              model: usageTotals.model || null,
              prompt_tokens: usageTotals.promptTokens,
              completion_tokens: usageTotals.completionTokens,
              tokens_used: usageTotals.totalTokens,
              estimated_cost_usd: usageTotals.estimatedCostUsd,
              error: trimErrorMessage(fatalError),
            })
            .eq("id", generation.id);
        }

        writeEvent({
          type: "error",
          error: fatalError,
          partial: Boolean(finalFiles),
          warnings: finalWarnings,
        });

        if (finalFiles) {
          writeEvent({
            type: "result",
            projectId: project.id,
            files: finalFiles,
            preview: finalPreview,
            partial: true,
            warnings: [...finalWarnings, fatalError],
          });
        }
      } finally {
        try {
          if (usageSession) {
            await usageSession.release();
          }
          controller.close();
        } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "x-qorvex-project-id": project.id,
    },
  });
}
