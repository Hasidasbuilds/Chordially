/**
 * Issue #77 – Add stream provider metadata support to live sessions
 *
 * File destination: apps/api/src/modules/sessions/stream-provider.routes.ts
 *
 * Register in apps/api/src/modules/index.ts:
 *   import { streamProviderRouter } from "./sessions/stream-provider.routes.js";
 *   app.use("/sessions", streamProviderRouter);
 *
 * Endpoints:
 *   GET  /sessions/:id/stream         – public, returns provider + embedUrl
 *   PUT  /sessions/:id/stream         – requireAuth, ARTIST only; set/update provider
 */

import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import {
  getStreamProvider,
  upsertStreamProvider,
  validateStreamUrl,
} from "./stream-provider.store.js";
import type { StreamProvider } from "./stream-provider.store.js";

export const streamProviderRouter = Router();

const VALID_PROVIDERS: StreamProvider[] = ["youtube", "twitch", "custom", "none"];

// ─── GET /sessions/:id/stream ─────────────────────────────────────────────────
// Public – returns the stream provider and embed URL for a session page.
// Returns 200 with provider:"none" when no stream is configured.

streamProviderRouter.get("/:id/stream", (req, res) => {
  const record = getStreamProvider(req.params.id);

  if (!record) {
    return res.json({ sessionId: req.params.id, provider: "none", embedUrl: null });
  }

  res.json({
    sessionId: record.sessionId,
    provider: record.provider,
    embedUrl: record.embedUrl ?? null,
    updatedAt: record.updatedAt,
  });
});

// ─── PUT /sessions/:id/stream ─────────────────────────────────────────────────
// Authenticated artist sets or updates the stream provider for their session.

streamProviderRouter.put("/:id/stream", requireAuth, (req, res) => {
  const user = req.authUser!;

  if (user.role !== "ARTIST") {
    return res.status(403).json({ error: "Artist role required." });
  }

  const { provider, streamUrl } = req.body as {
    provider?: string;
    streamUrl?: string;
  };

  if (!provider || !VALID_PROVIDERS.includes(provider as StreamProvider)) {
    return res.status(400).json({
      error: `provider must be one of: ${VALID_PROVIDERS.join(", ")}.`,
    });
  }

  const validationError = validateStreamUrl(provider as StreamProvider, streamUrl);
  if (validationError) {
    return res.status(400).json({ error: validationError.message });
  }

  const record = upsertStreamProvider(req.params.id, provider as StreamProvider, streamUrl?.trim());
  res.json(record);
});
