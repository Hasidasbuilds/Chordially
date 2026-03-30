/**
 * Issue #77 – Add stream provider metadata support to live sessions
 *
 * File destination: apps/api/src/modules/sessions/stream-provider.store.ts
 *
 * What this does:
 *  - In-memory store that associates a stream provider + URL with a session
 *  - Supported providers: "youtube" | "twitch" | "custom" | "none"
 *  - Validates embeddable URLs per provider rules
 *  - Rejects unsupported or invalid URLs with clear error messages
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type StreamProvider = "youtube" | "twitch" | "custom" | "none";

export interface StreamProviderRecord {
  sessionId: string;
  provider: StreamProvider;
  streamUrl?: string;    // raw URL as entered by the artist
  embedUrl?: string;     // normalised embed URL ready for <iframe>
  updatedAt: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const YOUTUBE_PATTERNS = [
  /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
  /^https?:\/\/youtu\.be\/[\w-]+/,
  /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
  /^https?:\/\/(www\.)?youtube\.com\/live\/[\w-]+/,
];

const TWITCH_PATTERNS = [
  /^https?:\/\/(www\.)?twitch\.tv\/[\w]+$/,
  /^https?:\/\/player\.twitch\.tv\/\?channel=[\w]+/,
];

export type ProviderValidationError = { message: string };

export function validateStreamUrl(
  provider: StreamProvider,
  url: string | undefined
): ProviderValidationError | null {
  if (provider === "none") return null;

  if (!url?.trim()) {
    return { message: "streamUrl is required for the selected provider." };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { message: "streamUrl must be a valid URL." };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { message: "streamUrl must use http or https." };
  }

  if (provider === "youtube") {
    const valid = YOUTUBE_PATTERNS.some((p) => p.test(url));
    if (!valid) return { message: "URL does not look like a valid YouTube video or live URL." };
  }

  if (provider === "twitch") {
    const valid = TWITCH_PATTERNS.some((p) => p.test(url));
    if (!valid) return { message: "URL does not look like a valid Twitch channel or player URL." };
  }

  // "custom" accepts any valid http/https URL – no further checks.
  return null;
}

/** Convert a raw YouTube/Twitch URL to an embeddable URL for <iframe> */
export function toEmbedUrl(provider: StreamProvider, url: string): string | undefined {
  if (provider === "none" || !url) return undefined;

  if (provider === "youtube") {
    // Extract video ID from various YouTube URL forms
    let videoId: string | null = null;

    const watchMatch = url.match(/[?&]v=([\w-]+)/);
    if (watchMatch) videoId = watchMatch[1];

    const shortMatch = url.match(/youtu\.be\/([\w-]+)/);
    if (shortMatch) videoId = shortMatch[1];

    const embedMatch = url.match(/\/embed\/([\w-]+)/);
    if (embedMatch) videoId = embedMatch[1];

    const liveMatch = url.match(/\/live\/([\w-]+)/);
    if (liveMatch) videoId = liveMatch[1];

    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    return url; // already an embed or unrecognised – pass through
  }

  if (provider === "twitch") {
    // Extract channel name
    const channelMatch = url.match(/twitch\.tv\/([\w]+)$/);
    if (channelMatch) {
      return `https://player.twitch.tv/?channel=${channelMatch[1]}&parent=localhost`;
    }
    return url;
  }

  // custom – return as-is
  return url;
}

// ─── In-memory store ──────────────────────────────────────────────────────────

const store = new Map<string, StreamProviderRecord>(); // keyed by sessionId

// ─── Seed data ────────────────────────────────────────────────────────────────

function seed() {
  const entries: StreamProviderRecord[] = [
    {
      sessionId: "sess-1",
      provider: "youtube",
      streamUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      updatedAt: "2026-03-27T18:00:00.000Z",
    },
    {
      sessionId: "sess-2",
      provider: "twitch",
      streamUrl: "https://www.twitch.tv/streettempo",
      embedUrl: "https://player.twitch.tv/?channel=streettempo&parent=localhost",
      updatedAt: "2026-03-27T18:30:00.000Z",
    },
  ];

  for (const entry of entries) {
    store.set(entry.sessionId, entry);
  }
}

seed();

// ─── Query helpers ────────────────────────────────────────────────────────────

export function getStreamProvider(sessionId: string): StreamProviderRecord | null {
  return store.get(sessionId) ?? null;
}

export function upsertStreamProvider(
  sessionId: string,
  provider: StreamProvider,
  streamUrl?: string
): StreamProviderRecord {
  const embedUrl = provider !== "none" && streamUrl
    ? toEmbedUrl(provider, streamUrl)
    : undefined;

  const record: StreamProviderRecord = {
    sessionId,
    provider,
    streamUrl,
    embedUrl,
    updatedAt: new Date().toISOString(),
  };

  store.set(sessionId, record);
  return record;
}
