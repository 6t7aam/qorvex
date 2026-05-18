import type { Metadata } from "next";
import { ReferralsClient } from "@/components/dashboard/ReferralsClient";
import { createPrivatePageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = createPrivatePageMetadata({
  title: "Referral Program",
  description:
    "Invite builders to Qorvex and earn bonus AI credits when they upgrade to paid plans.",
  path: "/referrals",
});

export default function ReferralsPage() {
  return <ReferralsClient />;
}
