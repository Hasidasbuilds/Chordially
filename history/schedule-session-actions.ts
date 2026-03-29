/**
 * Issue #75 – Add session scheduling and upcoming performance states
 *
 * File destination: apps/web/app/artist/schedule/actions.ts
 *
 * Server Actions for the schedule page:
 *  - scheduleSession   – POST /sessions with scheduledFor
 *  - startScheduledSession – POST /sessions/:id/start
 */

"use server";

import { redirect } from "next/navigation";
import { getArtist } from "../../../lib/artist";

export async function scheduleSession(formData: FormData) {
  const artist = getArtist();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const scheduledFor = String(formData.get("scheduledFor") ?? "").trim();

  if (!title || !scheduledFor) {
    redirect("/artist/schedule?error=missing_fields");
  }

  // Convert datetime-local value ("2026-03-30T20:00") to ISO string
  const isoDate = new Date(scheduledFor).toISOString();

  try {
    const res = await fetch("http://localhost:3001/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer demo-token",
      },
      body: JSON.stringify({
        title,
        description,
        scheduledFor: isoDate,
        artistName: artist.stageName,
        slug: artist.slug,
        city: artist.city,
        genres: artist.genres.split(",").map((g) => g.trim()),
      }),
    });

    if (!res.ok) {
      redirect("/artist/schedule?error=api_error");
    }
  } catch {
    // API not running – proceed in demo mode
  }

  redirect("/artist/schedule?saved=1");
}

export async function startScheduledSession(formData: FormData) {
  const sessionId = String(formData.get("sessionId") ?? "").trim();
  if (!sessionId) redirect("/artist/schedule");

  try {
    await fetch(`http://localhost:3001/sessions/${sessionId}/start`, {
      method: "POST",
      headers: { Authorization: "Bearer demo-token" },
    });
  } catch {
    // API not running – fall through
  }

  redirect(`/artist/schedule?started=${sessionId}`);
}
