// CHORD-055: Public artist profile read API

import type { Request, Response, Router } from "express";
import { resolveSlug } from "./slug.js";

export interface PublicArtistProfile {
  artistId: string;
  slug: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  isLive: boolean;
  featuredMoments: string[];
  supporterCount: number;
  completionScore: number;
}

// In-memory store — replace with DB query in production
const profiles = new Map<string, PublicArtistProfile>();

export function upsertProfile(profile: PublicArtistProfile): void {
  profiles.set(profile.artistId, profile);
}

export function getPublicProfile(artistId: string): PublicArtistProfile | null {
  return profiles.get(artistId) ?? null;
}

function handleGetBySlug(req: Request, res: Response): void {
  const artistId = resolveSlug(req.params.slug);
  if (!artistId) { res.status(404).json({ error: "Artist not found" }); return; }

  const profile = getPublicProfile(artistId);
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

  res.json({ data: profile });
}

function handleGetById(req: Request, res: Response): void {
  const profile = getPublicProfile(req.params.artistId);
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }
  res.json({ data: profile });
}

export function registerArtistProfileRoutes(router: Router): void {
  router.get("/artists/:artistId/profile", handleGetById);
  router.get("/artists/by-slug/:slug", handleGetBySlug);
}
