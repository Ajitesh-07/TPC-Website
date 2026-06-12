import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../lib/prisma";
import { sendMail } from "../lib/mailer";
import { env } from "../config/env";

const TOKEN_TTL_MIN = 15;
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/**
 * Send a magic-link login email to a provisioned recruiter. Always succeeds
 * silently (no account enumeration): if the email isn't a known, active company
 * recruiter, nothing is sent but the caller still gets a 200.
 */
export async function requestRecruiterLogin(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || user.role !== "company" || user.status !== "active") return;

  const token = randomBytes(32).toString("hex");
  await prisma.loginToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(token),
      purpose: "recruiter_login",
      expiresAt: new Date(Date.now() + TOKEN_TTL_MIN * 60 * 1000),
    },
  });

  const link = `${env.apiBaseUrl}/auth/recruiter/verify?token=${token}`;
  // Fire-and-forget the email: awaiting the SMTP round-trip here would make the
  // response time reveal whether the address is a provisioned recruiter (an
  // account-enumeration timing oracle). Send out-of-band instead.
  void sendMail(
    user.email,
    "Sign in to the IIT Patna TPC portal",
    `<p>Hello,</p>
     <p>Click the button below to sign in. This link is valid for ${TOKEN_TTL_MIN} minutes and can be used once.</p>
     <p><a href="${link}" style="background:#002d59;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Sign in</a></p>
     <p>If you didn't request this, you can ignore this email.</p>`
  ).catch((err) => console.error("[recruiter] magic-link send failed:", err?.message ?? err));
}

/**
 * Validate a magic-link token. Returns the user on success (single-use,
 * unexpired), or null otherwise.
 */
export async function verifyRecruiterLogin(token: string) {
  const row = await prisma.loginToken.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) return null;

  await prisma.loginToken.update({ where: { id: row.id }, data: { usedAt: new Date() } });
  await prisma.user.update({ where: { id: row.userId }, data: { lastLoginAt: new Date() } });
  return row.user;
}
