// CHORD-053: Artist slug reservation and uniqueness enforcement

const reservedSlugs = new Set(["admin", "api", "live", "support", "help", "about", "explore"]);

interface SlugRecord {
  artistId: string;
  slug: string;
  reservedAt: Date;
  previousSlugs: string[];
}

const slugStore = new Map<string, SlugRecord>();
const artistSlugIndex = new Map<string, string>(); // artistId -> current slug

function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{2,38}[a-z0-9]$/.test(slug);
}

export function reserveSlug(artistId: string, rawSlug: string): { ok: boolean; slug?: string; error?: string } {
  const slug = normalizeSlug(rawSlug);

  if (!isValidSlug(slug)) {
    return { ok: false, error: "Slug must be 4–40 chars, lowercase alphanumeric and hyphens only." };
  }

  if (reservedSlugs.has(slug)) {
    return { ok: false, error: `Slug "${slug}" is reserved.` };
  }

  const existing = slugStore.get(slug);
  if (existing && existing.artistId !== artistId) {
    return { ok: false, error: `Slug "${slug}" is already taken.` };
  }

  const previousSlug = artistSlugIndex.get(artistId);
  const previousSlugs = previousSlug
    ? [...(slugStore.get(previousSlug)?.previousSlugs ?? []), previousSlug]
    : [];

  if (previousSlug && previousSlug !== slug) {
    // Keep old slug in store for redirect purposes, mark as redirecting
    const old = slugStore.get(previousSlug);
    if (old) slugStore.set(previousSlug, { ...old, artistId: `redirect:${artistId}` });
  }

  slugStore.set(slug, { artistId, slug, reservedAt: new Date(), previousSlugs });
  artistSlugIndex.set(artistId, slug);

  return { ok: true, slug };
}

export function resolveSlug(slug: string): { artistId: string; redirect?: string } | null {
  const record = slugStore.get(normalizeSlug(slug));
  if (!record) return null;

  if (record.artistId.startsWith("redirect:")) {
    const realId = record.artistId.replace("redirect:", "");
    const current = artistSlugIndex.get(realId);
    return current ? { artistId: realId, redirect: current } : null;
  }

  return { artistId: record.artistId };
}

export function getArtistSlug(artistId: string): string | null {
  return artistSlugIndex.get(artistId) ?? null;
}
