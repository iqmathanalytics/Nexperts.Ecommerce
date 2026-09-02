/**
 * Email marketing journey stubs — wire to cron (Render cron / node-cron) in production.
 * Templates: welcome (3), abandoned cart (4h + 24h), post-purchase, loyalty.
 */
import { sendEmail } from "../utils/email";

export async function sendWelcomeSeries(to: string, firstName: string) {
  const subjects = [
    `Welcome to Nexperts, ${firstName}`,
    "Find your fit — take the style quiz",
    "Your first look awaits",
  ];
  for (const subject of subjects) {
    await sendEmail({
      to,
      subject,
      text: `${subject}. Shop curated clothing at Nexperts.`,
      html: `<p>Hi ${firstName},</p><p>${subject}. Shop curated clothing at Nexperts.</p>`,
    }).catch(() => undefined);
  }
}

export async function sendAbandonedCart(to: string, firstName: string, hours: 4 | 24) {
  await sendEmail({
    to,
    subject: hours === 4 ? "Your bag is waiting" : "Still thinking it over?",
    text: `Hi ${firstName}, you left items in your bag ${hours} hours ago.`,
    html: `<p>Hi ${firstName},</p><p>You left items in your bag ${hours} hours ago. Complete checkout when you're ready.</p>`,
  }).catch(() => undefined);
}

export async function sendPostPurchase(to: string, firstName: string, orderNumber: string) {
  await sendEmail({
    to,
    subject: `Order ${orderNumber} — care tips & styling`,
    text: `Thanks for order ${orderNumber}.`,
    html: `<p>Hi ${firstName},</p><p>Thanks for your order ${orderNumber}. Care tips and a review prompt are on the way.</p>`,
  }).catch(() => undefined);
}

export async function sendLoyaltyUpdate(to: string, firstName: string, points: number) {
  await sendEmail({
    to,
    subject: `You earned ${points} loyalty points`,
    text: `Your loyalty balance grew by ${points} points.`,
    html: `<p>Hi ${firstName},</p><p>Your Nexperts loyalty balance just grew by ${points} points.</p>`,
  }).catch(() => undefined);
}

/** Invoke from a scheduled job — no-op scanner placeholder */
export async function runEmailCronTick() {
  return { ok: true, note: "Hook abandoned-cart queries here" };
}
