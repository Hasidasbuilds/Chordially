import crypto from "node:crypto";
import type { Request, Response } from "express";
import { signToken } from "./auth.tokens.js";
import { getUserById } from "./auth.store.js";

interface WalletNonce {
  nonce: string;
  expiresAt: number;
}

// Nonce store keyed by wallet address (lowercased)
const nonceStore = new Map<string, WalletNonce>();
const NONCE_TTL_MS = 1000 * 60 * 5; // 5 minutes

// Wallet → userId mapping (populated on first verified sign-in)
const walletIndex = new Map<string, string>();

export function issueNonce(address: string): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  nonceStore.set(address.toLowerCase(), { nonce, expiresAt: Date.now() + NONCE_TTL_MS });
  return nonce;
}

/** Verify an HMAC-SHA256 signature over "chordially:<nonce>" using the wallet address as key.
 *  Real EVM wallets use secp256k1 — swap this stub for ethers.js verifyMessage in production. */
function verifySignature(address: string, nonce: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", address.toLowerCase())
    .update(`chordially:${nonce}`)
    .digest("hex");
  return signature === expected;
}

export function handleWalletNonce(req: Request, res: Response) {
  const { address } = req.body as { address?: string };
  if (!address) {
    res.status(400).json({ error: "address_required" });
    return;
  }
  const nonce = issueNonce(address);
  res.json({ nonce, message: `chordially:${nonce}` });
}

export function handleWalletSignIn(req: Request, res: Response) {
  const { address, signature, userId } = req.body as {
    address?: string;
    signature?: string;
    userId?: string;
  };

  if (!address || !signature || !userId) {
    res.status(400).json({ error: "address_signature_userId_required" });
    return;
  }

  const key = address.toLowerCase();
  const record = nonceStore.get(key);

  if (!record || record.expiresAt < Date.now()) {
    res.status(401).json({ error: "nonce_expired_or_missing" });
    return;
  }

  nonceStore.delete(key); // single-use

  if (!verifySignature(address, record.nonce, signature)) {
    res.status(401).json({ error: "invalid_signature" });
    return;
  }

  const user = getUserById(userId);
  if (!user) {
    res.status(404).json({ error: "user_not_found" });
    return;
  }

  walletIndex.set(key, userId);
  const token = signToken(userId);
  res.json({ token, user });
}
