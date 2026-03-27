import Link from "next/link";
import { Shell } from "../components/layout/shell";
import { Card } from "../components/ui/card";
import { getArtist } from "../lib/artist";

export default function HomePage() {
  const artist = getArtist();

  return (
    <Shell
      title="Artist onboarding that leads directly to a public profile."
      subtitle="This branch adds a guided artist setup flow and a public artist page that can ship before backend profile storage exists."
    >
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Card title="Onboarding">
          <p className="muted">
            Capture stage name, location, genres, bio, and a Stellar wallet in one focused setup form.
          </p>
          <a className="button" href="/artist/onboarding">
            Start artist setup
          </a>
        </Card>
        <Card title="Profile preview">
          <p className="muted">
            Current demo artist: <strong>{artist.stageName}</strong>
          </p>
          <Link className="profile-link" href={`/artists/${artist.slug}`}>
            Open public profile
          </Link>
        </Card>
      </div>
    </Shell>
  );
}
