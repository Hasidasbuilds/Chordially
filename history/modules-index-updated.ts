/**
 * Issues #74 #75 #76 #77 – Stellar Wave Wave 3
 *
 * File destination: apps/api/src/modules/index.ts  (replaces existing)
 *
 * Registers all routers added in this wave alongside the existing ones.
 *
 * Route map:
 *   GET  /health                          – health check
 *   GET  /system                          – system readiness
 *   GET  /tips/history                    – fan tip history (#73)
 *   GET  /sessions/:id/tips/feed          – live tip feed (#71)
 *   GET  /sessions/:id/leaderboard        – supporter leaderboard (#72)
 *   GET  /artist/earnings                 – lifetime earnings summary (#74)
 *   GET  /artist/earnings/:sessionId      – per-session earnings (#74)
 *   GET  /sessions                        – list sessions (live | upcoming) (#75)
 *   GET  /sessions/:id                    – single session (#75)
 *   POST /sessions                        – create session (#75)
 *   POST /sessions/:id/publish            – publish draft (#75)
 *   POST /sessions/:id/start              – go live (#75)
 *   POST /sessions/:id/end               – end session (#75)
 *   GET  /artists/:slug/media             – public artist media (#76)
 *   PUT  /artists/me/media                – update own media (#76)
 *   GET  /sessions/:id/stream             – stream provider metadata (#77)
 *   PUT  /sessions/:id/stream             – set stream provider (#77)
 */

import type { Express } from "express";
import { healthRouter } from "./health/health.routes.js";
import { systemRouter } from "./system/system.routes.js";
import { tipRouter } from "./tips/tip.routes.js";
import { earningsRouter } from "./earnings/earnings.routes.js";
import { sessionRouter } from "./sessions/session-schedule.routes.js";
import { streamProviderRouter } from "./sessions/stream-provider.routes.js";
import { artistMediaRouter } from "./artists/artist-media.routes.js";

export function registerModules(app: Express) {
  app.use("/health", healthRouter);
  app.use("/system", systemRouter);

  // Tips (wave 2: #71 #72 #73)
  app.use("/", tipRouter);

  // Earnings dashboard (#74)
  app.use("/artist", earningsRouter);

  // Session scheduling + lifecycle (#75)
  app.use("/sessions", sessionRouter);

  // Stream provider metadata (#77)
  // Mounted on /sessions so it shares /:id/stream routes
  app.use("/sessions", streamProviderRouter);

  // Artist media/profile enrichment (#76)
  app.use("/artists", artistMediaRouter);
}
