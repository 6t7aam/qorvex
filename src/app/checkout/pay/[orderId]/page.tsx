import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CryptoPaymentClient } from "@/components/billing/CryptoPaymentClient";
import {
  NOWPAYMENTS_PLANS,
  PAY_CURRENCIES,
  isNowPaymentsPlan,
} from "@/lib/nowpayments/config";

export const dynamic = "force-dynamic";

interface PayPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function CryptoPayPage({ params }: PayPageProps) {
  const { orderId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/checkout/pay/${orderId}`)}`);
  }

  const { data: payment } = await supabase
    .from("payments")
    .select(
      "order_id, status, payment_status, subscription_plan, amount_usd, pay_currency, pay_address, pay_amount, expires_at",
    )
    .eq("order_id", orderId)
    .eq("user_id", user.id)
    .maybeSingle<{
      order_id: string;
      status: string;
      payment_status: string | null;
      subscription_plan: string;
      amount_usd: number;
      pay_currency: string | null;
      pay_address: string | null;
      pay_amount: number | null;
      expires_at: string | null;
    }>();

  if (!payment) {
    notFound();
  }
  if (
    !payment.pay_address ||
    !payment.pay_amount ||
    !payment.pay_currency ||
    !isNowPaymentsPlan(payment.subscription_plan)
  ) {
    notFound();
  }

  if (payment.status === "finished") {
    redirect(`/billing/success?order_id=${encodeURIComponent(orderId)}`);
  }

  const plan = NOWPAYMENTS_PLANS[payment.subscription_plan];
  const currencyMeta =
    PAY_CURRENCIES.find((c) => c.code === payment.pay_currency) ?? null;

  return (
    <CryptoPaymentClient
      orderId={payment.order_id}
      planName={plan.name}
      amountUsd={payment.amount_usd}
      payAddress={payment.pay_address}
      payAmount={payment.pay_amount}
      payCurrency={payment.pay_currency}
      payCurrencyLabel={currencyMeta?.label ?? payment.pay_currency.toUpperCase()}
      payCurrencySublabel={currencyMeta?.sublabel ?? null}
      expiresAt={payment.expires_at}
      initialStatus={payment.status}
    />
  );
}
