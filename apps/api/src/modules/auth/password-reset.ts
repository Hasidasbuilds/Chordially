import crypto from "node:crypto";
import type { Request, Response } from "express";
import { authenticateUser, getUserById } from "./auth.store.js";

// Thin shims until the store grows these helpers
function getUserByEmail(email: string) {
  // authenticateUser requires password; we probe via a sentinel that won't match
  void email;
  return null; // replaced by real lookup once store exposes it
}
function updateUserPassword(_userId: string, _newPassword: string) {
  // no-op stub; real impl hashes and persists
}

interface ResetRecord {
  userId: string;
  tokenHash: string;
  expiresAt: number;
  used: boolean;
}

const store = new Map<string, ResetRecord>(); // keyed by userId
const TOKEN_TTL_MS = 1000 * 60 * 30; // 30 minutes

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function issueResetToken(userId: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  store.set(userId, {
    userId,
    tokenHash: hashToken(token),
    expiresAt: Date.now() + TOKEN_TTL_MS,
    used: false,
  });
  return token;
}

export function consumeResetToken(token: string): string | null {
  const hash = hashToken(token);
  for (const record of store.values()) {
    if (record.tokenHash !== hash) continue;
    if (record.used || record.expiresAt < Date.now()) return null;
    record.used = true;
    return record.userId;
  }
  return null;
}

export function handlePasswordResetRequest(req: Request, res: Response) {
  const { email } = req.body as { email?: string };
  // Always respond 200 to prevent account enumeration
  if (!email) {
    res.json({ message: "If that email exists, a reset link was sent" });
    return;
  }

  const user = getUserByEmail(email);
  if (user) {
    const token = issueResetToken(user.id);
    // In production: enqueue email with reset link containing token
    void token;
  }

  res.json({ message: "If that email exists, a reset link was sent" });
}

export function handlePasswordResetComplete(req: Request, res: Response) {
  const { token, newPassword } = req.body as { token?: string; newPassword?: string };

  if (!token || !newPassword) {
    res.status(400).json({ error: "token_and_password_required" });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: "password_too_short" });
    return;
  }

  const userId = consumeResetToken(token);
  if (!userId) {
    res.status(400).json({ error: "invalid_or_expired_token" });
    return;
  }

  updateUserPassword(userId, newPassword);
  res.json({ message: "Password updated" });
}
