/**
 * Issue #75 – Add session scheduling and upcoming performance states
 *
 * File destination: apps/api/src/modules/sessions/session-schedule.routes.ts
 *
 * Register in apps/api/src/modules/index.ts:
 *   import { sessionRouter } from "./sessions/session-schedule.routes.js";
 *   app.use("/sessions", sessionRouter);
 *
 * Endpoints:
 *   GET  /sessions                  – list sessions (public, ?status=live|upcoming)
 *   GET  /sessions/:id              – get single session (public)
 *   POST /sessions                  – create session (requireAuth, ARTIST only)
 *   POST /sessions/:id/publish      – publish a DRAFT with scheduledFor (requireAuth, ARTIST)
 *   POST /sessions/:id/start        – transition SCHEDULED → LIVE (requireAuth, ARTIST)
 *   POST /sessions/:id/end          – transition LIVE → ENDED (requireAuth, ARTIST)
 */

import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import {
  listSessions,
  getSession,
  createSession,
  publishSession,
  startSession,
  endSession,
} from "./session-schedule.store.js";

export const sessionRouter = Router();

// ─── GET /sessions ────────────────────────────────────────────────────────────
// Public listing split by status.  Default: live.

sessionRouter.get("/", (req, res) => {
  const rawStatus = req.query.status as string | undefined;
  const status = rawStatus === "upcoming" ? "upcoming" : "live";
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 12, 50);
  const offset = Math.max(parseInt(req.query.offset as string, 10) || 0, 0);

  const result = listSessions(status, limit, offset);
  res.json({ ...result, status, limit, offset });
});

// ─── GET /sessions/:id ────────────────────────────────────────────────────────

sessionRouter.get("/:id", (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found." });
  res.json(session);
});

// ─── POST /sessions ───────────────────────────────────────────────────────────
// Create a new session.  Providing `scheduledFor` moves it straight to SCHEDULED.

sessionRouter.post("/", requireAuth, (req, res) => {
  const user = req.authUser!;
  if (user.role !== "ARTIST") {
    return res.status(403).json({ error: "Artist role required." });
  }

  const { title, description, city, genres, slug, artistName, scheduledFor } = req.body as {
    title?: string;
    description?: string;
    city?: string;
    genres?: string[];
    slug?: string;
    artistName?: string;
    scheduledFor?: string;
  };

  if (!title?.trim()) {
    return res.status(400).json({ error: "title is required." });
  }

  if (scheduledFor && isNaN(Date.parse(scheduledFor))) {
    return res.status(400).json({ error: "scheduledFor must be a valid ISO datetime." });
  }

  const session = createSession({
    artistProfileId: user.id,
    artistName: artistName ?? "Unknown Artist",
    slug: slug ?? user.id,
    title: title.trim(),
    description: description?.trim(),
    city: city?.trim() ?? "",
    genres: Array.isArray(genres) ? genres : [],
    scheduledFor: scheduledFor ?? undefined,
  });

  res.status(201).json(session);
});

// ─── POST /sessions/:id/publish ───────────────────────────────────────────────
// Attach a scheduledFor datetime and move DRAFT → SCHEDULED.

sessionRouter.post("/:id/publish", requireAuth, (req, res) => {
  const user = req.authUser!;
  const session = getSession(req.params.id);

  if (!session) return res.status(404).json({ error: "Session not found." });
  if (session.artistProfileId !== user.id) return res.status(403).json({ error: "Forbidden." });

  const { scheduledFor } = req.body as { scheduledFor?: string };
  if (!scheduledFor || isNaN(Date.parse(scheduledFor))) {
    return res.status(400).json({ error: "scheduledFor is required and must be a valid ISO datetime." });
  }

  const updated = publishSession(req.params.id, scheduledFor);
  if (!updated) return res.status(409).json({ error: "Session cannot be published in its current state." });

  res.json(updated);
});

// ─── POST /sessions/:id/start ─────────────────────────────────────────────────
// Transition SCHEDULED (or DRAFT) → LIVE.

sessionRouter.post("/:id/start", requireAuth, (req, res) => {
  const user = req.authUser!;
  const session = getSession(req.params.id);

  if (!session) return res.status(404).json({ error: "Session not found." });
  if (session.artistProfileId !== user.id) return res.status(403).json({ error: "Forbidden." });

  const updated = startSession(req.params.id);
  if (!updated) return res.status(409).json({ error: "Session cannot be started in its current state." });

  res.json(updated);
});

// ─── POST /sessions/:id/end ───────────────────────────────────────────────────
// Transition LIVE → ENDED.

sessionRouter.post("/:id/end", requireAuth, (req, res) => {
  const user = req.authUser!;
  const session = getSession(req.params.id);

  if (!session) return res.status(404).json({ error: "Session not found." });
  if (session.artistProfileId !== user.id) return res.status(403).json({ error: "Forbidden." });

  const updated = endSession(req.params.id);
  if (!updated) return res.status(409).json({ error: "Session cannot be ended in its current state." });

  res.json(updated);
});
