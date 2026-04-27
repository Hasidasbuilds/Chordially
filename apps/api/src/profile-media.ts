// CHORD-054: Profile media upload contract and validation

export type MediaKind = "avatar" | "banner";

const LIMITS: Record<MediaKind, { maxBytes: number; maxWidth: number; maxHeight: number }> = {
  avatar: { maxBytes: 2 * 1024 * 1024, maxWidth: 1000, maxHeight: 1000 },
  banner: { maxBytes: 8 * 1024 * 1024, maxWidth: 3840, maxHeight: 1080 },
};

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface MediaUploadRequest {
  artistId: string;
  kind: MediaKind;
  mimeType: string;
  sizeBytes: number;
  widthPx: number;
  heightPx: number;
  virusScanPassed: boolean;
}

export interface MediaUploadResult {
  ok: boolean;
  errors: string[];
  auditTag?: string;
}

export function validateMediaUpload(req: MediaUploadRequest): MediaUploadResult {
  const errors: string[] = [];
  const limit = LIMITS[req.kind];

  if (!ALLOWED_MIME.has(req.mimeType)) {
    errors.push(`MIME type "${req.mimeType}" not allowed. Use JPEG, PNG, or WebP.`);
  }

  if (req.sizeBytes > limit.maxBytes) {
    errors.push(`File exceeds ${limit.maxBytes / (1024 * 1024)} MB limit for ${req.kind}.`);
  }

  if (req.widthPx > limit.maxWidth || req.heightPx > limit.maxHeight) {
    errors.push(`Dimensions ${req.widthPx}×${req.heightPx} exceed max ${limit.maxWidth}×${limit.maxHeight} for ${req.kind}.`);
  }

  if (!req.virusScanPassed) {
    errors.push("Upload blocked: virus scan did not pass.");
  }

  if (errors.length > 0) return { ok: false, errors };

  const auditTag = `media:${req.kind}:${req.artistId}:${Date.now()}`;
  return { ok: true, errors: [], auditTag };
}

export function buildUploadKey(artistId: string, kind: MediaKind, mimeType: string): string {
  const ext = mimeType.split("/")[1] ?? "bin";
  return `profiles/${artistId}/${kind}-${Date.now()}.${ext}`;
}
