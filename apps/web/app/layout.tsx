import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chordially Artist Onboarding",
  description: "Artist onboarding and public profile preview."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
