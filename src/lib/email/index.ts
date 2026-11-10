import "server-only";
import { getServerEnv } from "@/lib/env";

type Mail = { to: string; subject: string; text: string; replyTo?: string };

/**
 * Provider-agnostic email sender. Implemented against the Resend HTTP API; swap the fetch call
 * to use another provider. Disabled unless EMAIL_PROVIDER_API_KEY, EMAIL_FROM and EMAIL_NOTIFY_TO are set.
 * Failures never block form submission and never leak details to visitors.
 */
export function emailEnabled(): boolean {
  const e = getServerEnv();
  return Boolean(e.EMAIL_PROVIDER_API_KEY && e.EMAIL_FROM && e.EMAIL_NOTIFY_TO);
}

export async function sendNotification(mail: Omit<Mail, "to"> & { to?: string }): Promise<boolean> {
  const env = getServerEnv();
  if (!env.EMAIL_PROVIDER_API_KEY || !env.EMAIL_FROM || !(mail.to ?? env.EMAIL_NOTIFY_TO)) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.EMAIL_PROVIDER_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [mail.to ?? env.EMAIL_NOTIFY_TO],
        subject: mail.subject.replace(/[\r\n]+/g, " ").slice(0, 200),
        text: mail.text,
        reply_to: mail.replyTo,
      }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch (err) {
    console.error("email send failed", (err as Error).message);
    return false;
  }
}
