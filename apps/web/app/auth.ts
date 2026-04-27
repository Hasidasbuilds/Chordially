/**
 * CHORD-064 – Cookie-based auth integration for server and client components.
 *
 * Server-side helpers read the session cookie via next/headers; the client
 * helper clears it through a fetch to the sign-out route.
 */

import { cookies } from "next/headers";

const SESSION_COOKIE = "chordially_session";

export interface Session {
  userId: string;
  role: "artist" | "fan" | "admin";
  expiresAt: number;
}

/** Server-only: parse and return the current session, or null if absent/expired. */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  let session: Session;
  try {
    session = JSON.parse(Buffer.from(raw, "base64").toString("utf8")) as Session;
  } catch {
    return null;
  }

  if (Date.now() > session.expiresAt) return null;
  return session;
}

/** Server-only: assert a session exists, throw if not (use in Server Actions). */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("Unauthenticated");
  return session;
}

/** Server-only: assert the session role matches one of the allowed roles. */
export async function requireRole(...roles: Session["role"][]): Promise<Session> {
  const session = await requireSession();
  if (!roles.includes(session.role)) throw new Error("Forbidden");
  return session;
}

/** Client-side: call the sign-out API route and reload. */
export async function signOut(): Promise<void> {
  await fetch("/api/auth/sign-out", { method: "POST" });
  window.location.href = "/login";
}
