/**
 * Issue #77 – Add stream provider metadata support to live sessions
 *
 * File destination: apps/web/components/StreamPlayer.tsx
 *
 * What this does:
 *  - Client component that renders the appropriate stream player for a session
 *  - YouTube / Twitch → <iframe> embed
 *  - Custom URL → <video> tag fallback
 *  - "none" / missing → CTA prompting the artist to share a stream link
 *
 * Usage:
 *   <StreamPlayer provider={provider} embedUrl={embedUrl} isLive={true} />
 */

"use client";

interface StreamPlayerProps {
  provider: "youtube" | "twitch" | "custom" | "none";
  embedUrl?: string | null;
  /** When true, shows a "LIVE" badge on the player */
  isLive?: boolean;
}

export function StreamPlayer({ provider, embedUrl, isLive = false }: StreamPlayerProps) {
  if (provider === "none" || !embedUrl) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          background: "var(--surface, #111)",
          borderRadius: 8,
          padding: "2rem",
          textAlign: "center",
          minHeight: 160,
        }}
      >
        <span style={{ fontSize: "2rem" }}>🎵</span>
        <p className="muted">No stream configured for this session yet.</p>
        <p className="muted" style={{ fontSize: "0.85em" }}>
          The artist may be streaming on their own platform.
        </p>
      </div>
    );
  }

  if (provider === "youtube" || provider === "twitch") {
    return (
      <div style={{ position: "relative", width: "100%", aspectRatio: "16/9" }}>
        {isLive ? (
          <span
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              zIndex: 2,
              background: "#e53",
              color: "#fff",
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            LIVE
          </span>
        ) : null}
        <iframe
          src={embedUrl}
          style={{ width: "100%", height: "100%", border: "none", borderRadius: 8 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={`${provider} stream`}
        />
      </div>
    );
  }

  // Custom URL – attempt <video> first; falls back to external link
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "16/9" }}>
      {isLive ? (
        <span
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            zIndex: 2,
            background: "#e53",
            color: "#fff",
            padding: "2px 8px",
            borderRadius: 4,
            fontSize: "0.75rem",
            fontWeight: 700,
          }}
        >
          LIVE
        </span>
      ) : null}
      <video
        src={embedUrl}
        controls
        style={{ width: "100%", height: "100%", borderRadius: 8, background: "#000" }}
        onError={(e) => {
          // If native video fails, replace with a link CTA
          const target = e.currentTarget;
          target.style.display = "none";
          const sibling = target.nextElementSibling as HTMLElement | null;
          if (sibling) sibling.style.display = "flex";
        }}
      />
      {/* Shown only when video fails to load */}
      <div
        style={{
          display: "none",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          background: "var(--surface, #111)",
          borderRadius: 8,
          padding: "2rem",
          textAlign: "center",
          width: "100%",
          height: "100%",
        }}
      >
        <p className="muted">Stream unavailable in browser.</p>
        <a className="button" href={embedUrl} target="_blank" rel="noopener noreferrer">
          Open stream
        </a>
      </div>
    </div>
  );
}
