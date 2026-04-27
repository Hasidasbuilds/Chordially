// CHORD-054: Profile media upload contract and validation

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const DIMENSIONS = { minWidth: 200, minHeight: 200, maxWidth: 4096, maxHeight: 4096 };

export type MediaKind = "avatar" | "banner" | "gallery";

export interface MediaUploadRequest {
  artistId: string;
  kind: MediaKind;
  mimeType: string;
  sizeBytes: number;
  widthPx: number;
  heightPx: number;
  filename: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateMediaUpload(req: MediaUploadRequest): ValidationResult {
  const errors: string[] = [];

  if (!ALLOWED_MIME.has(req.mimeType)) errors.push(`Unsupported type: ${req.mimeType}`);
  if (req.sizeBytes > MAX_BYTES) errors.push(`File exceeds ${MAX_BYTES / 1024 / 1024} MB limit`);
  if (req.widthPx < DIMENSIONS.minWidth || req.heightPx < DIMENSIONS.minHeight)
    errors.push(`Minimum dimensions are ${DIMENSIONS.minWidth}x${DIMENSIONS.minHeight}px`);
  if (req.widthPx > DIMENSIONS.maxWidth || req.heightPx > DIMENSIONS.maxHeight)
    errors.push(`Maximum dimensions are ${DIMENSIONS.maxWidth}x${DIMENSIONS.maxHeight}px`);
  if (req.kind === "avatar" && req.widthPx !== req.heightPx)
    errors.push("Avatar must be square");

  return { valid: errors.length === 0, errors };
}

export function buildUploadKey(req: MediaUploadRequest): string {
  const ext = req.mimeType.split("/")[1];
  return `artists/${req.artistId}/${req.kind}/${Date.now()}.${ext}`;
}

export function virusScanHook(key: string): Promise<{ clean: boolean }> {
  // Hook point: integrate with ClamAV or cloud AV service before finalising upload
  console.log(`[virus-scan] queued: ${key}`);
  return Promise.resolve({ clean: true });
}
