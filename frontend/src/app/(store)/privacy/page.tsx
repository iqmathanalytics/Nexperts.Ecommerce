import type { Metadata } from "next";
import { StaticPage } from "@/components/store/StaticPage";
import { PrivacyControls } from "@/components/store/PrivacyControls";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <StaticPage title="Privacy Policy">
      <p>
        {process.env.NEXT_PUBLIC_SITE_NAME ?? "Nexperts"} collects account information (name, email, phone, addresses)
        to process orders, provide customer support, and improve your shopping experience.
      </p>
      <p>
        Order and payment details are stored securely on our servers. We do not sell your personal data to third parties.
        Card data is never stored — online payments use Razorpay when enabled.
      </p>
      <p>
        You may update your profile from account settings, export your data, manage marketing consent, or request deletion below.
      </p>
      <PrivacyControls />
      <p className="mt-8">We may update this policy from time to time. Continued use of the store constitutes acceptance of changes.</p>
    </StaticPage>
  );
}
