/**
 * Issue #76 – Implement artist media/profile enrichment
 *
 * File destination: apps/api/src/modules/artists/artist-media.routes.ts
 *
 * Register in apps/api/src/modules/index.ts:
 *   import { artistMediaRouter } from "./artists/artist-media.routes.js";
 *   app.use("/artists", artistMediaRouter);
 *
 * Endpoints:
 *   GET  /artists/:slug/media         – public profile media (no auth)
 *   PUT  /artists/me/media            – update own media (requireAuth, ARTIST)
 */

import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import {
  getArtistMedia,
  upsertArtistMedia,
  validateMedia,
} from "./artist-media.store.js";

export const artistMediaRouter = Router();

// ─── GET /artists/:slug/media ─────────────────────────────────────────────────
// Public endpoint – returns enriched media for an artist's public page.
// `slug` is used here as the lookup key; in production this would join
// against ArtistProfile.slug → ArtistProfile.id.

artistMediaRouter.get("/:slug/media", (req, res) => {
  // Demo: slug doubles as artistProfileId for in-memory lookup
  const media = getArtistMedia(req.params.slug);
  if (!media) {
    return res.json({
      artistProfileId: req.params.slug,
      genreTags: [],
      socialLinks: {},
      updatedAt: null,
    });
  }
  res.json(media);
});

// ─── PUT /artists/me/media ────────────────────────────────────────────────────
// Authenticated artist updates their own media profile.

artistMediaRouter.put("/me/media", requireAuth, (req, res) => {
  const user = req.authUser!;

  if (user.role !== "ARTIST") {
    return res.status(403).json({ error: "Artist role required." });
  }

  const {
    profileImageUrl,
    bannerUrl,
    genreTags,
    socialLinks,
    introClipUrl,
  } = req.body as {
    profileImageUrl?: string;
    bannerUrl?: string;
    genreTags?: string[];
    socialLinks?: {
      instagram?: string;
      twitter?: string;
      youtube?: string;
      website?: string;
    };
    introClipUrl?: string;
  };

  const errors = validateMedia({ profileImageUrl, bannerUrl, genreTags, socialLinks, introClipUrl });
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const updated = upsertArtistMedia(user.id, {
    profileImageUrl,
    bannerUrl,
    genreTags,
    socialLinks,
    introClipUrl,
  });

  res.json(updated);
});
