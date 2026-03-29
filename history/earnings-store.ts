/**
 * Issue #74 – Add artist earnings dashboard with session and lifetime summaries
 *
 * File destination: apps/api/src/modules/earnings/earnings.store.ts
 *
 * What this does:
 *  - Aggregates confirmed tips from the tip store into per-session and lifetime summaries
 *  - Supports multiple asset codes (XLM, USDC) – totals are kept separate per asset
 *  - Only CONFIRMED tips affect earnings calculations
 */

import { getTipsBySession } from "./tip-store.js";
import type { StoredTip, TipAssetCode } from "./tip-store.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AssetTotal {
  assetCode: TipAssetCode;
  amount: number;
  tipCount: number;
}

export interface SessionEarningSummary {
  sessionId: string;
  sessionTitle: string;
  totals: AssetTotal[];
  tipCount: number;
  startedAt?: string;
}

export interface LifetimeEarningSummary {
  totals: AssetTotal[];
  tipCount: number;
  sessionCount: number;
  sessions: SessionEarningSummary[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function aggregateByAsset(tips: StoredTip[]): AssetTotal[] {
  const map = new Map<TipAssetCode, { amount: number; count: number }>();

  for (const tip of tips) {
    const existing = map.get(tip.assetCode);
    if (existing) {
      existing.amount += tip.amount;
      existing.count += 1;
    } else {
      map.set(tip.assetCode, { amount: tip.amount, count: 1 });
    }
  }

  return [...map.entries()].map(([assetCode, data]) => ({
    assetCode,
    amount: Math.round(data.amount * 1e7) / 1e7, // preserve Stellar precision
    tipCount: data.count,
  }));
}

// ─── In-memory session registry (mirrors discovery mock) ──────────────────────
// Maps sessionId → artistProfileId + sessionTitle so earnings can be scoped
// to a single artist without a real DB query.

interface SessionMeta {
  sessionId: string;
  artistProfileId: string;
  sessionTitle: string;
  startedAt?: string;
}

const sessionRegistry: SessionMeta[] = [
  {
    sessionId: "sess-1",
    artistProfileId: "artist-1",
    sessionTitle: "Rooftop Rehearsal",
    startedAt: "2026-03-27T18:00:00.000Z",
  },
  {
    sessionId: "sess-2",
    artistProfileId: "artist-2",
    sessionTitle: "Percussion & Brass Jam",
    startedAt: "2026-03-27T18:30:00.000Z",
  },
];

export function registerSession(meta: SessionMeta) {
  if (!sessionRegistry.find((s) => s.sessionId === meta.sessionId)) {
    sessionRegistry.push(meta);
  }
}

// ─── Query helpers ────────────────────────────────────────────────────────────

/** Per-session earnings summary for one artist – uses confirmed tips only */
export function getSessionEarning(
  sessionId: string,
  artistProfileId: string
): SessionEarningSummary | null {
  const meta = sessionRegistry.find(
    (s) => s.sessionId === sessionId && s.artistProfileId === artistProfileId
  );
  if (!meta) return null;

  const tips = getTipsBySession(sessionId); // already filtered to CONFIRMED
  const totals = aggregateByAsset(tips);

  return {
    sessionId,
    sessionTitle: meta.sessionTitle,
    totals,
    tipCount: tips.length,
    startedAt: meta.startedAt,
  };
}

/** Lifetime earnings summary for one artist across all their sessions */
export function getLifetimeEarnings(artistProfileId: string): LifetimeEarningSummary {
  const artistSessions = sessionRegistry.filter(
    (s) => s.artistProfileId === artistProfileId
  );

  const sessions: SessionEarningSummary[] = [];
  const allTips: StoredTip[] = [];

  for (const meta of artistSessions) {
    const tips = getTipsBySession(meta.sessionId);
    allTips.push(...tips);
    sessions.push({
      sessionId: meta.sessionId,
      sessionTitle: meta.sessionTitle,
      totals: aggregateByAsset(tips),
      tipCount: tips.length,
      startedAt: meta.startedAt,
    });
  }

  return {
    totals: aggregateByAsset(allTips),
    tipCount: allTips.length,
    sessionCount: sessions.length,
    sessions,
  };
}
