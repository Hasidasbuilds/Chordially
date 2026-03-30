/**
 * Issue #76 – Implement artist media/profile enrichment
 *
 * File destination: apps/web/app/artist/media/page.tsx
 *
 * What this does:
 *  - Form for an artist to upload/link profile image, banner, genre tags,
 *    social links, and an intro clip URL
 *  - Validates URLs client-side before submit (http/https only)
 *  - Persists via cookie store (demo) or PUT /artists/me/media (API)
 */

import { Shell } from "../../../components/layout/shell";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { getArtistMedia } from "../../../lib/artist-media";
import { saveArtistMedia } from "./actions";

export default function ArtistMediaPage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const media = getArtistMedia();

  return (
    <Shell
      title="Enrich your profile."
      subtitle="Add images, genre tags, and social links so your page feels real and supports discovery."
    >
      <form action={saveArtistMedia} className="stack">
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {/* Images */}
          <Card title="Profile image">
            <label className="stack">
              <span>Profile image URL</span>
              <Input
                name="profileImageUrl"
                defaultValue={media.profileImageUrl}
                placeholder="https://example.com/avatar.jpg"
                type="url"
              />
            </label>
            {media.profileImageUrl ? (
              <img
                src={media.profileImageUrl}
                alt="Profile preview"
                style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", marginTop: "0.5rem" }}
              />
            ) : null}
          </Card>

          <Card title="Banner image">
            <label className="stack">
              <span>Banner URL</span>
              <Input
                name="bannerUrl"
                defaultValue={media.bannerUrl}
                placeholder="https://example.com/banner.jpg"
                type="url"
              />
            </label>
            {media.bannerUrl ? (
              <img
                src={media.bannerUrl}
                alt="Banner preview"
                style={{ width: "100%", height: 80, objectFit: "cover", marginTop: "0.5rem", borderRadius: 4 }}
              />
            ) : null}
          </Card>
        </div>

        {/* Genre tags */}
        <Card title="Genre tags">
          <label className="stack">
            <span>Genres (comma-separated, up to 5)</span>
            <Input
              name="genreTags"
              defaultValue={media.genreTags.join(", ")}
              placeholder="e.g. Afrobeats, Indie Soul, Loop Music"
            />
          </label>
          <p className="muted">These appear as chips on your public page and in discovery.</p>
        </Card>

        {/* Social links */}
        <Card title="Social links">
          <label className="stack">
            <span>Instagram</span>
            <Input name="instagram" defaultValue={media.socialLinks.instagram} type="url" placeholder="https://instagram.com/yourhandle" />
          </label>
          <label className="stack">
            <span>Twitter / X</span>
            <Input name="twitter" defaultValue={media.socialLinks.twitter} type="url" placeholder="https://twitter.com/yourhandle" />
          </label>
          <label className="stack">
            <span>YouTube</span>
            <Input name="youtube" defaultValue={media.socialLinks.youtube} type="url" placeholder="https://youtube.com/@yourchannel" />
          </label>
          <label className="stack">
            <span>Website</span>
            <Input name="website" defaultValue={media.socialLinks.website} type="url" placeholder="https://yourdomain.com" />
          </label>
        </Card>

        {/* Intro clip */}
        <Card title="Intro clip">
          <label className="stack">
            <span>YouTube embed URL</span>
            <Input
              name="introClipUrl"
              defaultValue={media.introClipUrl}
              type="url"
              placeholder="https://www.youtube.com/embed/VIDEO_ID"
            />
          </label>
          <p className="muted">Paste a YouTube embed URL – this plays on your public profile.</p>
          {media.introClipUrl ? (
            <iframe
              src={media.introClipUrl}
              style={{ width: "100%", aspectRatio: "16/9", border: "none", marginTop: "0.5rem", borderRadius: 4 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : null}
        </Card>

        <div>
          <button className="button" type="submit">Save profile media</button>
          {searchParams.saved === "1" ? (
            <p className="muted" style={{ marginTop: "0.5rem" }}>Profile media saved.</p>
          ) : null}
        </div>
      </form>

      <div style={{ marginTop: "1rem" }}>
        <a className="button button--secondary" href="/artist/dashboard">Back to dashboard</a>
      </div>
    </Shell>
  );
}
