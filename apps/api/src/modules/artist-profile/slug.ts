// CHORD-053: Artist slug reservation and uniqueness enforcement

const reservedSlugs = new Set(["admin", "api", "support", "help", "about", "login", "signup"]);

interface SlugRecord {
  artistId: string;
  slug: string;
  reservedAt: Date;
  previousSlugs: string[];
}

const slugStore = new Map<string, SlugRecord>();
const slugIndex = new Map<string, string>(); // slug -> artistId

function normalize(slug: string): string {
  return slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function isSlugAvailable(slug: string): boolean {
  const s = normalize(slug);
  return !reservedSlugs.has(s) && !slugIndex.has(s);
}

export function reserveSlug(artistId: string, slug: string): { ok: boolean; error?: string } {
  const s = normalize(slug);

  if (s.length < 3 || s.length > 32) return { ok: false, error: "Slug must be 3–32 characters" };
  if (!isSlugAvailable(s)) return { ok: false, error: "Slug is already taken" };

  const existing = slugStore.get(artistId);
  const previousSlugs = existing ? [...existing.previousSlugs, existing.slug] : [];

  if (existing) slugIndex.delete(existing.slug);

  slugStore.set(artistId, { artistId, slug: s, reservedAt: new Date(), previousSlugs });
  slugIndex.set(s, artistId);

  return { ok: true };
}

export function resolveSlug(slug: string): string | null {
  return slugIndex.get(normalize(slug)) ?? null;
}

export function getSlugRecord(artistId: string): SlugRecord | null {
  return slugStore.get(artistId) ?? null;
}

export function releaseSlug(artistId: string): void {
  const record = slugStore.get(artistId);
  if (!record) return;
  slugIndex.delete(record.slug);
  slugStore.delete(artistId);
}
