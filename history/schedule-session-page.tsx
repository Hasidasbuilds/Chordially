/**
 * Issue #75 – Add session scheduling and upcoming performance states
 *
 * File destination: apps/web/app/artist/schedule/page.tsx
 *
 * What this does:
 *  - Lets an artist create a new scheduled session (with a future date/time)
 *  - Shows their existing SCHEDULED and DRAFT sessions below the form
 *  - "Start now" button on a scheduled session fires the POST /sessions/:id/start action
 *  - Discovery page already respects live vs upcoming via ?status=upcoming
 */

import { Shell } from "../../../components/layout/shell";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { getArtist } from "../../../lib/artist";
import { scheduleSession, startScheduledSession } from "./actions";

// ─── Types (mirrors session-schedule.store.ts) ────────────────────────────────

interface ScheduledSession {
  id: string;
  title: string;
  status: "DRAFT" | "SCHEDULED" | "LIVE" | "ENDED";
  scheduledFor?: string;
  startedAt?: string;
}

// ─── Data fetcher ─────────────────────────────────────────────────────────────

async function fetchArtistSessions(artistId: string): Promise<ScheduledSession[]> {
  try {
    const res = await fetch(
      `http://localhost:3001/sessions?artistProfileId=${encodeURIComponent(artistId)}&status=upcoming&limit=20`,
      { cache: "no-store" }
    );
    if (!res.ok) return DEMO_SESSIONS;
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return DEMO_SESSIONS;
  }
}

const DEMO_SESSIONS: ScheduledSession[] = [
  {
    id: "sess-3",
    title: "Acoustic Stories",
    status: "SCHEDULED",
    scheduledFor: new Date(Date.now() + 86_400_000).toISOString(),
  },
  {
    id: "sess-4",
    title: "Late Night Loops – Vol 2",
    status: "SCHEDULED",
    scheduledFor: new Date(Date.now() + 2 * 86_400_000).toISOString(),
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ScheduleSessionPage({
  searchParams,
}: {
  searchParams: { saved?: string; started?: string };
}) {
  const artist = getArtist();
  const upcomingSessions = await fetchArtistSessions(artist.slug);

  return (
    <Shell
      title="Schedule a session."
      subtitle="Set a future date and time so your upcoming set appears in the discovery feed before you go live."
    >
      <div className="grid" style={{ gridTemplateColumns: "1.1fr 0.9fr" }}>
        {/* Schedule form */}
        <Card title="New scheduled session">
          <form action={scheduleSession} className="stack">
            <label className="stack">
              <span>Session title</span>
              <Input name="title" required placeholder="e.g. Late Night Loops Vol 3" />
            </label>
            <label className="stack">
              <span>Description</span>
              <textarea
                className="textarea"
                name="description"
                placeholder="What listeners can expect..."
              />
            </label>
            <label className="stack">
              <span>Scheduled date &amp; time</span>
              <Input name="scheduledFor" type="datetime-local" required />
            </label>
            <button className="button" type="submit">
              Schedule session
            </button>
          </form>
          {searchParams.saved === "1" ? (
            <p className="muted">Session scheduled – it will appear in the upcoming feed.</p>
          ) : null}
        </Card>

        {/* Upcoming sessions list */}
        <div className="stack">
          <h2 style={{ margin: 0 }}>Your upcoming sessions</h2>
          {upcomingSessions.length === 0 ? (
            <Card title="None yet">
              <p className="muted">Scheduled sessions will appear here.</p>
            </Card>
          ) : null}
          {upcomingSessions.map((session) => (
            <Card key={session.id} title={session.title}>
              <span className="chip">{session.status}</span>
              {session.scheduledFor ? (
                <p className="muted">
                  Starts: {new Date(session.scheduledFor).toLocaleString()}
                </p>
              ) : null}
              <form action={startScheduledSession}>
                <input type="hidden" name="sessionId" value={session.id} />
                <button className="button" type="submit">
                  Go live now
                </button>
              </form>
              {searchParams.started === session.id ? (
                <p className="muted">Session is now live.</p>
              ) : null}
            </Card>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <a className="button button--secondary" href="/artist/dashboard">
          Back to dashboard
        </a>
        <a className="button button--secondary" href="/discover?status=upcoming">
          View upcoming feed
        </a>
      </div>
    </Shell>
  );
}
