// CHORD-057: Wallet attachment metadata on artist profiles

export type WalletNetwork = "ethereum" | "solana" | "polygon";

export interface WalletAttachment {
  artistId: string;
  address: string;
  network: WalletNetwork;
  verified: boolean;
  lastValidatedAt: string | null;
}

const store = new Map<string, WalletAttachment>();

export function attachWallet(data: WalletAttachment): WalletAttachment {
  if (!data.address || !data.artistId) {
    throw new Error("artistId and address are required");
  }
  const record: WalletAttachment = { ...data, lastValidatedAt: new Date().toISOString() };
  store.set(data.artistId, record);
  auditWalletChange(data.artistId, "attached", data.address);
  return record;
}

export function verifyWallet(artistId: string): WalletAttachment {
  const wallet = store.get(artistId);
  if (!wallet) throw new Error(`No wallet found for artist ${artistId}`);
  const updated = { ...wallet, verified: true, lastValidatedAt: new Date().toISOString() };
  store.set(artistId, updated);
  auditWalletChange(artistId, "verified", wallet.address);
  return updated;
}

export function getWallet(artistId: string): WalletAttachment | null {
  return store.get(artistId) ?? null;
}

export function detachWallet(artistId: string): void {
  if (!store.has(artistId)) throw new Error(`No wallet found for artist ${artistId}`);
  const wallet = store.get(artistId)!;
  store.delete(artistId);
  auditWalletChange(artistId, "detached", wallet.address);
}

const auditLog: Array<{ artistId: string; action: string; address: string; ts: string }> = [];

function auditWalletChange(artistId: string, action: string, address: string): void {
  auditLog.push({ artistId, action, address, ts: new Date().toISOString() });
}

export function getWalletAuditLog(artistId: string) {
  return auditLog.filter((e) => e.artistId === artistId);
}
