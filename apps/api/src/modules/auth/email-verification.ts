import crypto from "node:crypto";
import type { Request, Response } from "express";

interface VerificationRecord {
  userId: string;
  token: string;
  expiresAt: number;
  resendCount: number;
  verified: boolean;
}

const store = new Map<string, VerificationRecord>();
const MAX_RESENDS = 3;
const TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function issueVerificationToken(userId: string): string | null {
  const existing = store.get(userId);
  if (existing?.verified) return null;
  if (existing && existing.resendCount >= MAX_RESENDS) return null;

  const token = generateToken();
  store.set(userId, {
    userId,
    token,
    expiresAt: Date.now() + TOKEN_TTL_MS,
    resendCount: (existing?.resendCount ?? 0) + 1,
    verified: false,
  });

  return token;
}

export function verifyEmailToken(token: string): { ok: boolean; error?: string } {
  for (const record of store.values()) {
    if (record.token !== token) continue;
    if (record.verified) return { ok: false, error: "already_verified" };
    if (record.expiresAt < Date.now()) return { ok: false, error: "token_expired" };

    record.verified = true;
    return { ok: true };
  }
  return { ok: false, error: "invalid_token" };
}

export function handleVerifyEmail(req: Request, res: Response) {
  const { token } = req.body as { token?: string };
  if (!token) {
    res.status(400).json({ error: "token_required" });
    return;
  }

  const result = verifyEmailToken(token);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({ message: "Email verified" });
}

export function handleResendVerification(req: Request, res: Response) {
  const { userId } = req.body as { userId?: string };
  if (!userId) {
    res.status(400).json({ error: "user_id_required" });
    return;
  }

  const token = issueVerificationToken(userId);
  if (!token) {
    res.status(429).json({ error: "resend_limit_reached_or_already_verified" });
    return;
  }

  // In production: enqueue email delivery here
  res.json({ message: "Verification email sent" });
}
