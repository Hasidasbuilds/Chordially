/**
 * Issue #74 – Add artist earnings dashboard with session and lifetime summaries
 *
 * File destination: apps/api/src/modules/earnings/earnings.routes.ts
 *
 * Register in apps/api/src/modules/index.ts:
 *   import { earningsRouter } from "./earnings/earnings.routes.js";
 *   app.use("/artist", earningsRouter);
 *
 * Endpoints:
 *   GET /artist/earnings              – lifetime summary (requireAuth, ARTIST only)
 *   GET /artist/earnings/:sessionId   – single-session summary (requireAuth, ARTIST only)
 *
 * Notes:
 *  - Only CONFIRMED tips count toward totals
 *  - Totals are asset-aware (XLM and USDC kept separate)
 *  - artistProfileId is resolved from req.authUser.id (demo: uses the same id)
 */

import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { getLifetimeEarnings, getSessionEarning } from "./earnings.store.js";

export const earningsRouter = Router();

// ─── GET /artist/earnings ─────────────────────────────────────────────────────
// Returns lifetime earning totals + per-session breakdown for the authenticated artist.

earningsRouter.get("/earnings", requireAuth, (req, res) => {
  const user = req.authUser!;

  if (user.role !== "ARTIST") {
    return res.status(403).json({ error: "Artist role required." });
  }

  const summary = getLifetimeEarnings(user.id);
  res.json(summary);
});

// ─── GET /artist/earnings/:sessionId ─────────────────────────────────────────
// Returns earnings for a single session belonging to the authenticated artist.

earningsRouter.get("/earnings/:sessionId", requireAuth, (req, res) => {
  const user = req.authUser!;

  if (user.role !== "ARTIST") {
    return res.status(403).json({ error: "Artist role required." });
  }

  const { sessionId } = req.params;
  const summary = getSessionEarning(sessionId, user.id);

  if (!summary) {
    return res.status(404).json({ error: "Session not found or not owned by this artist." });
  }

  res.json(summary);
});
