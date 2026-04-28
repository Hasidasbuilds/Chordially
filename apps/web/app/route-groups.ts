/**
 * CHORD-061 – Route group definitions for the Next.js app shell.
 *
 * Separates public, authenticated-artist, authenticated-fan, and admin
 * experiences so each segment can carry its own layout and middleware.
 */

export type RouteGroup = "public" | "artist" | "fan" | "admin";

interface RouteConfig {
  group: RouteGroup;
  /** Path prefix used in the (group) folder convention */
  prefix: string;
  /** Whether the segment requires an authenticated session */
  protected: boolean;
  /** Roles allowed to access this segment */
  roles: string[];
}

export const ROUTE_GROUPS: RouteConfig[] = [
  {
    group: "public",
    prefix: "(public)",
    protected: false,
    roles: [],
  },
  {
    group: "artist",
    prefix: "(artist)",
    protected: true,
    roles: ["artist"],
  },
  {
    group: "fan",
    prefix: "(fan)",
    protected: true,
    roles: ["fan"],
  },
  {
    group: "admin",
    prefix: "(admin)",
    protected: true,
    roles: ["admin"],
  },
];

/** Returns the config for a given route group, throwing if unknown. */
export function getRouteGroup(group: RouteGroup): RouteConfig {
  const config = ROUTE_GROUPS.find((r) => r.group === group);
  if (!config) throw new Error(`Unknown route group: ${group}`);
  return config;
}

/** Returns true when the path prefix belongs to a protected segment. */
export function isProtectedPrefix(prefix: string): boolean {
  return ROUTE_GROUPS.some((r) => r.protected && prefix.startsWith(r.prefix));
}
