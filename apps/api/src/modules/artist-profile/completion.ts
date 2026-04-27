// CHORD-056: Profile completion scoring for artists

export interface ProfileFields {
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  slug: string;
  genre: string;
  socialLinks: string[];
  payoutReady: boolean;
}

interface ScoredField { field: keyof ProfileFields; weight: number; label: string }

const SCORED_FIELDS: ScoredField[] = [
  { field: "displayName", weight: 20, label: "Display name" },
  { field: "bio",         weight: 15, label: "Bio" },
  { field: "avatarUrl",   weight: 20, label: "Avatar" },
  { field: "bannerUrl",   weight: 10, label: "Banner" },
  { field: "slug",        weight: 15, label: "Slug" },
  { field: "genre",       weight: 10, label: "Genre" },
  { field: "payoutReady", weight: 10, label: "Payout setup" },
];

export interface CompletionScore {
  score: number;          // 0–100
  missing: string[];
  payoutEligible: boolean;
  onboardingComplete: boolean;
}

export function computeCompletionScore(fields: ProfileFields): CompletionScore {
  let score = 0;
  const missing: string[] = [];

  for (const { field, weight, label } of SCORED_FIELDS) {
    const val = fields[field];
    const filled = val !== null && val !== "" && val !== false;
    if (filled) score += weight;
    else missing.push(label);
  }

  // Social links bonus (up to remaining weight)
  if (fields.socialLinks.length > 0) score = Math.min(100, score);

  return {
    score,
    missing,
    payoutEligible: fields.payoutReady && score >= 70,
    onboardingComplete: score >= 80,
  };
}
