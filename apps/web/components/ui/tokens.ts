/**
 * CHORD-062 – Design token system for Chordially brand primitives.
 *
 * Defines spacing, typography, color, elevation, motion, and responsive
 * breakpoints as typed constants consumed by components and CSS-in-JS.
 */

export const color = {
  brand: {
    primary: "#7C3AED",
    secondary: "#A78BFA",
    accent: "#F59E0B",
  },
  neutral: {
    0: "#FFFFFF",
    100: "#F5F5F5",
    200: "#E5E5E5",
    700: "#404040",
    900: "#171717",
  },
  feedback: {
    error: "#EF4444",
    success: "#22C55E",
    warning: "#F59E0B",
  },
} as const;

export const spacing = {
  1: "0.25rem",
  2: "0.5rem",
  4: "1rem",
  6: "1.5rem",
  8: "2rem",
  12: "3rem",
  16: "4rem",
} as const;

export const typography = {
  fontFamily: { sans: "Inter, system-ui, sans-serif", mono: "JetBrains Mono, monospace" },
  fontSize: { xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.25rem", "2xl": "1.5rem", "4xl": "2.25rem" },
  fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
} as const;

export const elevation = {
  sm: "0 1px 2px rgba(0,0,0,.06)",
  md: "0 4px 6px rgba(0,0,0,.08)",
  lg: "0 10px 15px rgba(0,0,0,.10)",
} as const;

export const motion = {
  duration: { fast: "100ms", base: "200ms", slow: "400ms" },
  easing: { standard: "cubic-bezier(0.4,0,0.2,1)", decelerate: "cubic-bezier(0,0,0.2,1)" },
} as const;

export const breakpoint = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
} as const;
