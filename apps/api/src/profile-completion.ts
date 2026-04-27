// CHORD-056: Profile completion scoring for artists

export interface ArtistProfileFields {
  stageName: string;
  slug: string;
  bio: string;
  city: string;
  genres: string[];
  avatarUrl: string | null;
  bannerUrl: string | null;
  wallet: string | null;
  socialLinks: string[];
}

interface ScoredField {
  field: string;
  weight: number;
  complete: boolean;
}

export interface CompletionScore {
  score: number;          // 0–100
  missingFields: string[];
  payoutReady: boolean;
  onboardingComplete: boolean;
}

const FIELDS: Array<{ field: keyof ArtistProfileFields; weight: number; label: string }> = [
  { field: "stageName", weight: 20, label: "Stage name" },
  { field: "slug",      weight: 15, label: "Profile URL slug" },
  { field: "bio",       weight: 15, label: "Bio" },
  { field: "city",      weight: 10, label: "City" },
  { field: "genres",    weight: 10, label: "Genres" },
  { field: "avatarUrl", weight: 10, label: "Avatar photo" },
  { field: "bannerUrl", weight: 5,  label: "Banner image" },
  { field: "wallet",    weight: 10, label: "Stellar wallet" },
  { field: "socialLinks", weight: 5, label: "Social links" },
];

function isPresent(value: ArtistProfileFields[keyof ArtistProfileFields]): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function scoreProfile(profile: ArtistProfileFields): CompletionScore {
  const scored: ScoredField[] = FIELDS.map(({ field, weight, label }) => ({
    field: label,
    weight,
    complete: isPresent(profile[field]),
  }));

  const score = scored.reduce((sum, f) => sum + (f.complete ? f.weight : 0), 0);
  const missingFields = scored.filter((f) => !f.complete).map((f) => f.field);

  return {
    score,
    missingFields,
    payoutReady: !!profile.wallet && !!profile.slug && !!profile.stageName,
    onboardingComplete: score >= 80,
  };
}
