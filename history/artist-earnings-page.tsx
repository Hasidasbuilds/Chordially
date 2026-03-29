/**
 * Issue #74 – Add artist earnings dashboard with session and lifetime summaries
 *
 * File destination: apps/web/app/artist/earnings/page.tsx
 *
 * What this does:
 *  - Server component showing lifetime earnings totals + per-session breakdown
 *  - Fetches from GET /artist/earnings (falls back to demo data if API is unreachable)
 *  - Renders asset-aware totals (XLM and USDC shown separately)
 *  - Only confirmed tips are reflected in the numbers
 */

import { Shell } from "../../../components/layout/shell";
import { Card } from "../../../components/ui/card";

// ─── Types (mirrors earnings.store.ts) ───────────────────────────────────────

interface AssetTotal {
  assetCode: "XLM" | "USDC";
  amount: number;
  tipCount: number;
}

interface SessionEarningSummary {
  sessionId: string;
  sessionTitle: string;
  totals: AssetTotal[];
  tipCount: number;
  startedAt?: string;
}

interface LifetimeEarningSummary {
  totals: AssetTotal[];
  tipCount: number;
  sessionCount: number;
  sessions: SessionEarningSummary[];
}

// ─── Demo fallback ────────────────────────────────────────────────────────────

const DEMO: LifetimeEarningSummary = {
  totals: [
    { assetCode: "XLM", amount: 45, tipCount: 3 },
    { assetCode: "USDC", amount: 5, tipCount: 1 },
  ],
  tipCount: 4,
  sessionCount: 2,
  sessions: [
    {
      sessionId: "sess-1",
      sessionTitle: "Rooftop Rehearsal",
      totals: [{ assetCode: "XLM", amount: 45, tipCount: 3 }],
      tipCount: 3,
      startedAt: "2026-03-27T18:00:00.000Z",
    },
    {
      sessionId: "sess-2",
      sessionTitle: "Percussion & Brass Jam",
      totals: [{ assetCode: "USDC", amount: 5, tipCount: 1 }],
      tipCount: 1,
      startedAt: "2026-03-27T18:30:00.000Z",
    },
  ],
};

// ─── Data fetcher ─────────────────────────────────────────────────────────────

async function fetchEarnings(): Promise<LifetimeEarningSummary> {
  try {
    const res = await fetch("http://localhost:3001/artist/earnings", {
      headers: { Authorization: "Bearer demo-token" },
      cache: "no-store",
    });
    if (!res.ok) return DEMO;
    return res.json();
  } catch {
    return DEMO;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TotalRow({ totals }: { totals: AssetTotal[] }) {
  if (totals.length === 0) {
    return <p className="muted">No confirmed earnings yet.</p>;
  }
  return (
    <div className="stack">
      {totals.map((t) => (
        <div key={t.assetCode} style={{ display: "flex", justifyContent: "space-between" }}>
          <span className="chip">{t.assetCode}</span>
          <strong>
            {t.amount.toLocaleString(undefined, { maximumFractionDigits: 7 })} {t.assetCode}
          </strong>
          <span className="muted">{t.tipCount} tip{t.tipCount !== 1 ? "s" : ""}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ArtistEarningsPage() {
  const data = await fetchEarnings();

  return (
    <Shell
      title="Earnings dashboard."
      subtitle="Confirmed tip totals across all sessions. Only settled transactions count."
    >
      {/* Lifetime summary */}
      <Card title="Lifetime earnings">
        <TotalRow totals={data.totals} />
        <div style={{ marginTop: "0.75rem" }}>
          <span className="chip">{data.tipCount} total tips</span>
          <span className="chip">{data.sessionCount} sessions</span>
        </div>
      </Card>

      {/* Per-session breakdown */}
      <div className="grid">
        {data.sessions.map((session) => (
          <Card key={session.sessionId} title={session.sessionTitle}>
            <TotalRow totals={session.totals} />
            <div style={{ marginTop: "0.5rem" }}>
              <span className="chip">{session.tipCount} tip{session.tipCount !== 1 ? "s" : ""}</span>
              {session.startedAt ? (
                <span className="chip">{new Date(session.startedAt).toLocaleDateString()}</span>
              ) : null}
            </div>
          </Card>
        ))}
        {data.sessions.length === 0 ? (
          <Card title="No sessions">
            <p className="muted">No session earnings recorded yet.</p>
          </Card>
        ) : null}
      </div>

      <div style={{ marginTop: "1rem" }}>
        <a className="button button--secondary" href="/artist/dashboard">
          Back to dashboard
        </a>
      </div>
    </Shell>
  );
}
