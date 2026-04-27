// CHORD-055: Public artist profile read API

export interface PublicArtistProfile {
  artistId: string;
  slug: string;
  stageName: string;
  bio: string;
  city: string;
  genres: string[];
  avatarUrl: string | null;
  bannerUrl: string | null;
  isLive: boolean;
  featuredMoments: { title: string; timestamp: string }[];
  supporterSummary: { totalSupporters: number; topTipAmount: number };
}

type ProfileStore = Map<string, PublicArtistProfile>;

const store: ProfileStore = new Map();

export function upsertPublicProfile(profile: PublicArtistProfile): void {
  store.set(profile.slug, profile);
}

export function getPublicProfileBySlug(slug: string): PublicArtistProfile | null {
  return store.get(slug) ?? null;
}

export function getPublicProfileById(artistId: string): PublicArtistProfile | null {
  for (const p of store.values()) {
    if (p.artistId === artistId) return p;
  }
  return null;
}

export function buildPublicView(profile: PublicArtistProfile): Omit<PublicArtistProfile, "artistId"> {
  const { artistId: _omit, ...publicFields } = profile;
  return publicFields;
}

export function listLiveArtists(): PublicArtistProfile[] {
  return [...store.values()].filter((p) => p.isLive);
}

export function searchProfiles(query: string): PublicArtistProfile[] {
  const q = query.toLowerCase();
  return [...store.values()].filter(
    (p) =>
      p.stageName.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.genres.some((g) => g.toLowerCase().includes(q))
  );
}
