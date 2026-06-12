import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env";

/**
 * Outbound email. If SMTP is configured it sends for real; otherwise (dev) it
 * logs the message to the console so flows like the recruiter magic link can be
 * tested without a mail server — copy the link from the logs.
 */
let transporter: Transporter | null = null;
if (env.smtp.host) {
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: env.smtp.user && env.smtp.pass ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  });
}

export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  if (!transporter) {
    // Dev fallback — no SMTP configured.
    console.log(`\n[mailer:dev] (no SMTP configured)\n  To: ${to}\n  Subject: ${subject}\n  ${html}\n`);
    return;
  }
  await transporter.sendMail({ from: env.smtp.from, to, subject, html });
}
