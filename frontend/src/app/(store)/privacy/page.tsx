import type { Metadata } from "next";
import { StaticPage } from "@/components/store/StaticPage";

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
        Payment card data is not stored when using cash on delivery.
      </p>
      <p>
        You may update your profile, addresses, and password from your account settings. Contact us to request account
        deletion or a copy of your data.
      </p>
      <p>We may update this policy from time to time. Continued use of the store constitutes acceptance of changes.</p>
    </StaticPage>
  );
}
