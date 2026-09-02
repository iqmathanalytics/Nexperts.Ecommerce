import nodemailer from "nodemailer";
import { env, isProd } from "../config/env";

function isEmailConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null | undefined;

function getTransporter() {
  if (transporter !== undefined) return transporter;
  if (!isEmailConfigured()) {
    transporter = null;
    return transporter;
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
  return transporter;
}

export async function sendEmail(input: { to: string; subject: string; text: string; html: string }) {
  const mailer = getTransporter();
  if (!mailer) {
    if (!isProd) {
      console.log(`[email:dev] To: ${input.to}\nSubject: ${input.subject}\n${input.text}`);
    }
    return;
  }
  await mailer.sendMail({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: email,
    subject: `${env.SITE_NAME} — Reset your password`,
    text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, ignore this email.`,
    html: `
      <p>We received a request to reset your ${env.SITE_NAME} password.</p>
      <p><a href="${resetUrl}">Reset password</a></p>
      <p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
    `,
  });
}

export async function sendOrderConfirmationEmail(input: {
  email: string;
  firstName: string;
  orderNumber: string;
  total: number;
  orderId: number;
}) {
  const orderUrl = `${env.FRONTEND_URL}/account/orders/${input.orderId}`;
  const total = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR", maximumFractionDigits: 0 }).format(input.total);
  await sendEmail({
    to: input.email,
    subject: `${env.SITE_NAME} — Order ${input.orderNumber} confirmed`,
    text: `Hi ${input.firstName},\n\nThanks for your order ${input.orderNumber}.\nTotal: ${total}\n\nView order: ${orderUrl}`,
    html: `
      <p>Hi ${input.firstName},</p>
      <p>Thanks for your order <strong>${input.orderNumber}</strong>.</p>
      <p>Total: <strong>${total}</strong></p>
      <p><a href="${orderUrl}">View your order</a></p>
    `,
  });
}
