/**
 * Issue #75 – Add session scheduling and upcoming performance states
 *
 * File destination: apps/api/src/modules/sessions/session-schedule.store.ts
 *
 * What this does:
 *  - In-memory store for scheduled sessions (mirrors Prisma Session model)
 *  - Supports draft/published states and a scheduledFor datetime
 *  - Starting a scheduled session transitions it to LIVE and records startedAt
 *  - Exports query helpers used by session-schedule.routes.ts
 */

import crypto from "node:crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScheduledSessionStatus = "DRAFT" | "SCHEDULED" | "LIVE" | "ENDED";

export interface ScheduledSession {
  id: string;
  artistProfileId: string;
  artistName: string;
  slug: string;
  title: string;
  description?: string;
  city: string;
  genres: string[];
  status: ScheduledSessionStatus;
  scheduledFor?: string; // ISO datetime – absent for immediate/DRAFT sessions
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── In-memory store ──────────────────────────────────────────────────────────

const sessions = new Map<string, ScheduledSession>();

// ─── Seed data ────────────────────────────────────────────────────────────────

function seed() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86_400_000).toISOString();
  const dayAfter = new Date(now.getTime() + 2 * 86_400_000).toISOString();

  const seedSessions: ScheduledSession[] = [
    {
      id: "sess-1",
      artistProfileId: "artist-1",
      artistName: "Nova Chords",
      slug: "nova-chords",
      title: "Rooftop Rehearsal",
      description: "Loop pedal sets with audience requests.",
      city: "Lagos",
      genres: ["Afrobeats", "Indie Soul"],
      status: "LIVE",
      startedAt: "2026-03-27T18:00:00.000Z",
      createdAt: "2026-03-27T17:00:00.000Z",
      updatedAt: "2026-03-27T18:00:00.000Z",
    },
    {
      id: "sess-2",
      artistProfileId: "artist-2",
      artistName: "Street Tempo",
      slug: "street-tempo",
      title: "Percussion & Brass Jam",
      city: "Accra",
      genres: ["Jazz", "Highlife"],
      status: "LIVE",
      startedAt: "2026-03-27T18:30:00.000Z",
      createdAt: "2026-03-27T17:30:00.000Z",
      updatedAt: "2026-03-27T18:30:00.000Z",
    },
    {
      id: "sess-3",
      artistProfileId: "artist-3",
      artistName: "Midnight Strings",
      slug: "midnight-strings",
      title: "Acoustic Stories",
      description: "Intimate acoustic set with storytelling between songs.",
      city: "Nairobi",
      genres: ["Folk", "Indie"],
      status: "SCHEDULED",
      scheduledFor: tomorrow,
      createdAt: "2026-03-28T10:00:00.000Z",
      updatedAt: "2026-03-28T10:00:00.000Z",
    },
    {
      id: "sess-4",
      artistProfileId: "artist-1",
      artistName: "Nova Chords",
      slug: "nova-chords",
      title: "Late Night Loops – Vol 2",
      description: "Second instalment of the late night loop series.",
      city: "Lagos",
      genres: ["Afrobeats", "Indie Soul"],
      status: "SCHEDULED",
      scheduledFor: dayAfter,
      createdAt: "2026-03-28T12:00:00.000Z",
      updatedAt: "2026-03-28T12:00:00.000Z",
    },
  ];

  for (const s of seedSessions) {
    sessions.set(s.id, s);
  }
}

seed();

// ─── Query helpers ────────────────────────────────────────────────────────────

export type DiscoveryStatus = "live" | "upcoming";

/** List sessions by status. "upcoming" = SCHEDULED, "live" = LIVE */
export function listSessions(
  status: DiscoveryStatus,
  limit = 12,
  offset = 0
): { items: ScheduledSession[]; total: number } {
  const target: ScheduledSessionStatus = status === "live" ? "LIVE" : "SCHEDULED";
  const filtered = [...sessions.values()]
    .filter((s) => s.status === target)
    .sort((a, b) => {
      const aTime = a.scheduledFor ?? a.startedAt ?? a.createdAt;
      const bTime = b.scheduledFor ?? b.startedAt ?? b.createdAt;
      return aTime.localeCompare(bTime);
    });

  return { items: filtered.slice(offset, offset + limit), total: filtered.length };
}

/** Get all sessions for an artist (any status) */
export function getArtistSessions(artistProfileId: string): ScheduledSession[] {
  return [...sessions.values()]
    .filter((s) => s.artistProfileId === artistProfileId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Get a single session by id */
export function getSession(id: string): ScheduledSession | null {
  return sessions.get(id) ?? null;
}

/** Create a new scheduled session (DRAFT or SCHEDULED depending on scheduledFor) */
export function createSession(
  input: Omit<ScheduledSession, "id" | "status" | "createdAt" | "updatedAt">
): ScheduledSession {
  const now = new Date().toISOString();
  const session: ScheduledSession = {
    ...input,
    id: crypto.randomUUID(),
    status: input.scheduledFor ? "SCHEDULED" : "DRAFT",
    createdAt: now,
    updatedAt: now,
  };
  sessions.set(session.id, session);
  return session;
}

/** Publish a DRAFT session (sets scheduledFor and moves to SCHEDULED) */
export function publishSession(
  id: string,
  scheduledFor: string
): ScheduledSession | null {
  const session = sessions.get(id);
  if (!session || session.status !== "DRAFT") return null;
  session.status = "SCHEDULED";
  session.scheduledFor = scheduledFor;
  session.updatedAt = new Date().toISOString();
  return session;
}

/** Start a SCHEDULED session – transitions to LIVE */
export function startSession(id: string): ScheduledSession | null {
  const session = sessions.get(id);
  if (!session || (session.status !== "SCHEDULED" && session.status !== "DRAFT")) return null;
  session.status = "LIVE";
  session.startedAt = new Date().toISOString();
  session.updatedAt = session.startedAt;
  return session;
}

/** End a LIVE session */
export function endSession(id: string): ScheduledSession | null {
  const session = sessions.get(id);
  if (!session || session.status !== "LIVE") return null;
  session.status = "ENDED";
  session.endedAt = new Date().toISOString();
  session.updatedAt = session.endedAt;
  return session;
}
