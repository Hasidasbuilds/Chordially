/**
 * Issue #76 – Implement artist media/profile enrichment
 *
 * File destination: apps/api/src/modules/artists/artist-media.store.ts
 *
 * What this does:
 *  - In-memory store for per-artist media fields (extends ArtistProfile)
 *  - Fields: profileImageUrl, bannerUrl, genreTags, socialLinks, introClipUrl
 *  - URL sanitisation: only http/https accepted; rejects javascript: and data: URIs
 *  - Oversized string inputs are rejected before being stored
 */

import crypto from "node:crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  youtube?: string;
  website?: string;
}

export interface ArtistMedia {
  id: string;
  artistProfileId: string;
  profileImageUrl?: string;
  bannerUrl?: string;
  genreTags: string[];       // up to 5 tags, max 32 chars each
  socialLinks: SocialLinks;
  introClipUrl?: string;     // YouTube embed or direct video URL
  updatedAt: string;
}

// ─── Limits ───────────────────────────────────────────────────────────────────

const MAX_GENRE_TAGS = 5;
const MAX_TAG_LENGTH = 32;
const MAX_URL_LENGTH = 512;

// ─── URL validation ───────────────────────────────────────────────────────────

export function isSafeUrl(value: string | undefined): boolean {
  if (!value) return true; // optional fields are fine absent
  if (value.length > MAX_URL_LENGTH) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export type MediaValidationError = {
  field: string;
  message: string;
};

export function validateMedia(input: Partial<ArtistMediaInput>): MediaValidationError[] {
  const errors: MediaValidationError[] = [];

  const urlFields: Array<[keyof ArtistMediaInput, string]> = [
    ["profileImageUrl", "profileImageUrl"],
    ["bannerUrl", "bannerUrl"],
    ["introClipUrl", "introClipUrl"],
  ];

  for (const [field, label] of urlFields) {
    const val = input[field] as string | undefined;
    if (val !== undefined && !isSafeUrl(val)) {
      errors.push({ field: label, message: "Must be a valid http/https URL under 512 characters." });
    }
  }

  const socialUrlFields: Array<[keyof SocialLinks, string]> = [
    ["instagram", "socialLinks.instagram"],
    ["twitter", "socialLinks.twitter"],
    ["youtube", "socialLinks.youtube"],
    ["website", "socialLinks.website"],
  ];

  for (const [field, label] of socialUrlFields) {
    const val = input.socialLinks?.[field];
    if (val !== undefined && !isSafeUrl(val)) {
      errors.push({ field: label, message: "Must be a valid http/https URL under 512 characters." });
    }
  }

  if (input.genreTags !== undefined) {
    if (input.genreTags.length > MAX_GENRE_TAGS) {
      errors.push({ field: "genreTags", message: `Maximum ${MAX_GENRE_TAGS} genre tags allowed.` });
    }
    for (const tag of input.genreTags) {
      if (tag.length > MAX_TAG_LENGTH) {
        errors.push({ field: "genreTags", message: `Each genre tag must be under ${MAX_TAG_LENGTH} characters.` });
        break;
      }
    }
  }

  return errors;
}

// ─── Input type (subset submitted by the artist) ─────────────────────────────

export type ArtistMediaInput = Omit<ArtistMedia, "id" | "artistProfileId" | "updatedAt">;

// ─── In-memory store ──────────────────────────────────────────────────────────

const store = new Map<string, ArtistMedia>(); // keyed by artistProfileId

// ─── Seed data ────────────────────────────────────────────────────────────────

function seed() {
  const entries: ArtistMedia[] = [
    {
      id: "media-1",
      artistProfileId: "artist-1",
      profileImageUrl: "https://placehold.co/200x200?text=Nova+Chords",
      bannerUrl: "https://placehold.co/1200x400?text=Nova+Chords+Banner",
      genreTags: ["Afrobeats", "Indie Soul", "Loop Music"],
      socialLinks: {
        instagram: "https://instagram.com/novachords",
        youtube: "https://youtube.com/@novachords",
      },
      introClipUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      updatedAt: "2026-03-27T17:00:00.000Z",
    },
    {
      id: "media-2",
      artistProfileId: "artist-2",
      profileImageUrl: "https://placehold.co/200x200?text=Street+Tempo",
      bannerUrl: "https://placehold.co/1200x400?text=Street+Tempo+Banner",
      genreTags: ["Jazz", "Highlife", "Percussion"],
      socialLinks: {
        instagram: "https://instagram.com/streettempo",
        twitter: "https://twitter.com/streettempo",
      },
      updatedAt: "2026-03-27T17:30:00.000Z",
    },
  ];

  for (const entry of entries) {
    store.set(entry.artistProfileId, entry);
  }
}

seed();

// ─── Query helpers ────────────────────────────────────────────────────────────

export function getArtistMedia(artistProfileId: string): ArtistMedia | null {
  return store.get(artistProfileId) ?? null;
}

export function upsertArtistMedia(
  artistProfileId: string,
  input: Partial<ArtistMediaInput>
): ArtistMedia {
  const existing = store.get(artistProfileId);
  const now = new Date().toISOString();

  const updated: ArtistMedia = {
    id: existing?.id ?? crypto.randomUUID(),
    artistProfileId,
    profileImageUrl: input.profileImageUrl ?? existing?.profileImageUrl,
    bannerUrl: input.bannerUrl ?? existing?.bannerUrl,
    genreTags: input.genreTags ?? existing?.genreTags ?? [],
    socialLinks: { ...(existing?.socialLinks ?? {}), ...(input.socialLinks ?? {}) },
    introClipUrl: input.introClipUrl ?? existing?.introClipUrl,
    updatedAt: now,
  };

  store.set(artistProfileId, updated);
  return updated;
}
