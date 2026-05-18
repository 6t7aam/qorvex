import sharp from "sharp";
import { NextResponse } from "next/server";
import { PLANS } from "@/lib/constants";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/with-timeout";

export const dynamic = "force-dynamic";

const PAYMENT_SCREENSHOT_BUCKET = "payment-screenshots";
const MAX_SOURCE_FILE_SIZE = 10 * 1024 * 1024;
const MAX_STORED_FILE_SIZE = 10 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 60_000;
const DB_TIMEOUT_MS = 15_000;
const AUTH_TIMEOUT_MS = 10_000;
const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

class ManualPaymentError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ManualPaymentError";
    this.status = status;
  }
}

function sanitizeFileStem(filename: string) {
  const stem = filename.replace(/\.[^/.]+$/, "");
  const sanitized = stem
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return sanitized || "payment-proof";
}

function getFriendlyStorageErrorMessage(error: unknown) {
  const rawMessage =
    error instanceof Error ? error.message : "Could not upload screenshot.";
  const message = rawMessage.toLowerCase();

  if (message.includes("bucket") && message.includes("not found")) {
    return {
      status: 500,
      message:
        "Screenshot uploads are temporarily unavailable because the payment-screenshots bucket is missing.",
    };
  }

  if (
    message.includes("row-level security") ||
    message.includes("permission") ||
    message.includes("not authorized") ||
    message.includes("unauthorized")
  ) {
    return {
      status: 403,
      message:
        "Upload failed because the screenshot storage policy denied this request.",
    };
  }

  if (
    message.includes("entity too large") ||
    message.includes("payload too large") ||
    message.includes("file too large") ||
    message.includes("size limit")
  ) {
    return {
      status: 413,
      message: "Upload failed. Please try a smaller image or PDF.",
    };
  }

  return {
    status: 500,
    message: "Upload failed. Please try a smaller image or PDF.",
  };
}

function getFriendlyDatabaseErrorMessage(error: unknown) {
  const rawMessage =
    error instanceof Error ? error.message : "Could not save payment request.";
  const message = rawMessage.toLowerCase();

  if (message.includes("duplicate key") || message.includes("already exists")) {
    return "This payment order has already been submitted.";
  }

  if (message.includes("foreign key")) {
    return "Your billing profile was missing. Please try again now.";
  }

  if (
    message.includes("row-level security") ||
    message.includes("permission") ||
    message.includes("not authorized") ||
    message.includes("unauthorized")
  ) {
    return "The payment request could not be saved because the database policy denied it.";
  }

  return "We couldn't save the payment request. Please try again.";
}

async function cleanupUploadedFile(storagePath: string) {
  const admin = createAdminClient();
  const { error } = await withTimeout(
    admin.storage.from(PAYMENT_SCREENSHOT_BUCKET).remove([storagePath]),
    10_000,
    "Screenshot cleanup timed out.",
  );

  if (error) {
    console.error("[api/manual-payments] cleanup remove failed:", error);
  }
}

async function prepareUploadFile(file: File) {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new ManualPaymentError(
      415,
      "Unsupported file type. Please upload a JPG, PNG, WebP image, or PDF.",
    );
  }

  if (file.size <= 0) {
    throw new ManualPaymentError(
      400,
      "The selected file is empty. Please choose a valid image or PDF.",
    );
  }

  if (file.size > MAX_SOURCE_FILE_SIZE) {
    throw new ManualPaymentError(
      413,
      "Upload failed. Please try a smaller image or PDF.",
    );
  }

  const sourceBuffer = Buffer.from(await file.arrayBuffer());

  if (file.type === "application/pdf") {
    return {
      buffer: sourceBuffer,
      contentType: "application/pdf",
      extension: "pdf",
      originalName: file.name,
      size: sourceBuffer.byteLength,
    };
  }

  try {
    const optimizedBuffer = await sharp(sourceBuffer)
      .rotate()
      .resize({
        width: 1800,
        height: 1800,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();

    if (optimizedBuffer.byteLength > MAX_STORED_FILE_SIZE) {
      throw new ManualPaymentError(
        413,
        "Upload failed. Please try a smaller image or PDF.",
      );
    }

    return {
      buffer: optimizedBuffer,
      contentType: "image/webp",
      extension: "webp",
      originalName: file.name,
      size: optimizedBuffer.byteLength,
    };
  } catch (error) {
    if (error instanceof ManualPaymentError) {
      throw error;
    }

    console.error("[api/manual-payments] image optimization failed:", error);
    throw new ManualPaymentError(
      400,
      "We couldn't read that image. Please try a smaller image or PDF.",
    );
  }
}

export async function POST(request: Request) {
  let uploadedPath: string | null = null;

  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const {
      data: { user },
    } = await withTimeout(
      supabase.auth.getUser(),
      AUTH_TIMEOUT_MS,
      "Authentication timed out.",
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const plan = formData.get("plan");
    const orderId = formData.get("orderId");
    const screenshot = formData.get("screenshot");

    if (plan !== "pro" && plan !== "max") {
      return NextResponse.json(
        { success: false, error: "Invalid plan selection." },
        { status: 400 },
      );
    }

    if (typeof orderId !== "string" || orderId.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Order ID is required." },
        { status: 400 },
      );
    }

    if (!(screenshot instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Payment screenshot is required." },
        { status: 400 },
      );
    }

    const preparedFile = await prepareUploadFile(screenshot);
    const safeStem = sanitizeFileStem(preparedFile.originalName);
    const timestamp = Date.now();
    uploadedPath = `${user.id}/${orderId.trim()}/${timestamp}-${safeStem}.${preparedFile.extension}`;
    console.log("[api/manual-payments] authenticated submit start:", {
      userId: user.id,
      plan,
      orderId: orderId.trim(),
      storagePath: uploadedPath,
      sourceType: screenshot.type,
      sourceBytes: screenshot.size,
      storedType: preparedFile.contentType,
      storedBytes: preparedFile.size,
    });

    const uploadResult = await withTimeout(
      admin.storage
        .from(PAYMENT_SCREENSHOT_BUCKET)
        .upload(uploadedPath, preparedFile.buffer, {
          cacheControl: "3600",
          upsert: false,
          contentType: preparedFile.contentType,
        }),
      UPLOAD_TIMEOUT_MS,
      "Uploading screenshot timed out. Please try a smaller image or PDF.",
    );

    if (uploadResult.error) {
      console.error("[api/manual-payments] upload failed:", uploadResult.error);
      const friendly = getFriendlyStorageErrorMessage(uploadResult.error);
      return NextResponse.json(
        { success: false, error: friendly.message },
        { status: friendly.status },
      );
    }

    console.log("[api/manual-payments] storage upload succeeded:", uploadedPath);

    const { error: profileEnsureError } = await withTimeout(
      admin.from("user_profiles").upsert(
        {
          id: user.id,
          email: user.email ?? `${user.id}@users.qorvex.local`,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      ),
      DB_TIMEOUT_MS,
      "Ensuring billing profile timed out.",
    );

    if (profileEnsureError) {
      console.error(
        "[api/manual-payments] profile ensure failed:",
        profileEnsureError,
      );
      await cleanupUploadedFile(uploadedPath);
      return NextResponse.json(
        {
          success: false,
          error: getFriendlyDatabaseErrorMessage(profileEnsureError),
        },
        { status: 500 },
      );
    }

    const planConfig = plan === "max" ? PLANS.MAX : PLANS.PRO;
    const amount = planConfig.price;

    const { data: insertedPayment, error: insertError } = await withTimeout(
      admin
        .from("manual_payments")
        .insert({
          user_id: user.id,
          order_id: orderId.trim(),
          plan,
          amount,
          status: "pending",
          screenshot_url: uploadedPath,
          payment_comment: orderId.trim(),
        })
        .select("id")
        .single<{ id: string }>(),
      DB_TIMEOUT_MS,
      "Saving payment timed out.",
    );

    if (insertError) {
      console.error("[api/manual-payments] insert failed:", insertError);
      await cleanupUploadedFile(uploadedPath);
      return NextResponse.json(
        {
          success: false,
          error: getFriendlyDatabaseErrorMessage(insertError),
        },
        { status: 500 },
      );
    }

    console.log("[api/manual-payments] manual_payments insert succeeded:", {
      paymentId: insertedPayment.id,
      orderId: orderId.trim(),
    });

    const { error: profileError } = await withTimeout(
      admin
        .from("user_profiles")
        .update({ pending_plan: plan })
        .eq("id", user.id),
      DB_TIMEOUT_MS,
      "Updating pending plan timed out.",
    );

    if (profileError) {
      console.error("[api/manual-payments] pending_plan update failed:", profileError);
    }

    return NextResponse.json({
      success: true,
      paymentId: insertedPayment.id,
      orderId: orderId.trim(),
      screenshotPath: uploadedPath,
      storedContentType: preparedFile.contentType,
      storedBytes: preparedFile.size,
    });
  } catch (error) {
    if (uploadedPath) {
      try {
        await cleanupUploadedFile(uploadedPath);
      } catch (cleanupError) {
        console.error("[api/manual-payments] cleanup failed:", cleanupError);
      }
    }

    if (error instanceof ManualPaymentError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      );
    }

    const friendly = getFriendlyStorageErrorMessage(error);
    const isTimeout =
      error instanceof Error &&
      error.message.toLowerCase().includes("timed out");
    const message = isTimeout
      ? "Upload failed. Please try a smaller image or PDF."
      : friendly.message;

    console.error("[api/manual-payments] submit failed:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: isTimeout ? 504 : friendly.status },
    );
  }
}
