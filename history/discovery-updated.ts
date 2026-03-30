/**
 * Issue #75 – Add session scheduling and upcoming performance states
 *
 * File destination: apps/web/lib/discovery.ts  (replaces existing)
 *
 * Changes vs the previous version:
 *  - DiscoverySession gains `status` field: "LIVE" | "SCHEDULED" | "ENDED"
 *  - `isLive` is derived from status for backwards compat with existing card rendering
 *  - `scheduledFor` is a proper ISO string used for upcoming display
 *  - listDiscoverySessions filters on status correctly for "live" vs "upcoming"
 *  - Seed data includes two upcoming SCHEDULED sessions
 */

export type SessionStatus = "LIVE" | "SCHEDULED" | "ENDED";

export interface DiscoverySession {
  id: string;
  artistName: string;
  slug: string;
  title: string;
  city: string;
  genres: string[];
  status: SessionStatus;
  /** Derived convenience flag – true when status === "LIVE" */
  isLive: boolean;
  /** ISO datetime: startedAt for LIVE, scheduledFor for SCHEDULED */
  startsAt: string;
}

const sessions: DiscoverySession[] = [
  {
    id: "sess-1",
    artistName: "Nova Chords",
    slug: "nova-chords",
    title: "Rooftop Rehearsal",
    city: "Lagos",
    genres: ["Afrobeats", "Indie Soul"],
    status: "LIVE",
    isLive: true,
    startsAt: "2026-03-27T18:00:00.000Z",
  },
  {
    id: "sess-2",
    artistName: "Street Tempo",
    slug: "street-tempo",
    title: "Percussion & Brass Jam",
    city: "Accra",
    genres: ["Jazz", "Highlife"],
    status: "LIVE",
    isLive: true,
    startsAt: "2026-03-27T18:30:00.000Z",
  },
  {
    id: "sess-3",
    artistName: "Midnight Strings",
    slug: "midnight-strings",
    title: "Acoustic Stories",
    city: "Nairobi",
    genres: ["Folk", "Indie"],
    status: "SCHEDULED",
    isLive: false,
    startsAt: new Date(Date.now() + 86_400_000).toISOString(),
  },
  {
    id: "sess-4",
    artistName: "Nova Chords",
    slug: "nova-chords",
    title: "Late Night Loops – Vol 2",
    city: "Lagos",
    genres: ["Afrobeats", "Indie Soul"],
    status: "SCHEDULED",
    isLive: false,
    startsAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
  },
];

export interface DiscoveryQuery {
  status?: "live" | "upcoming";
  limit?: number;
  offset?: number;
}

export interface DiscoveryResponse {
  items: DiscoverySession[];
  total: number;
  limit: number;
  offset: number;
}

export function listDiscoverySessions(query: DiscoveryQuery = {}): DiscoveryResponse {
  const status = query.status ?? "live";
  const offset = query.offset ?? 0;
  const limit = query.limit ?? 12;

  const filtered = sessions.filter((s) =>
    status === "live" ? s.status === "LIVE" : s.status === "SCHEDULED"
  );

  return {
    items: filtered.slice(offset, offset + limit),
    total: filtered.length,
    limit,
    offset,
  };
}
