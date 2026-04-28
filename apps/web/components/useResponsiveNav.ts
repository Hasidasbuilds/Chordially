"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

export type NavLayout = "bottom" | "side";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Discover", icon: "🎵" },
  { href: "/live", label: "Live", icon: "🔴" },
  { href: "/wallet", label: "Wallet", icon: "💸" },
  { href: "/profile", label: "Profile", icon: "🎤" },
];

const MD_BREAKPOINT = 768;

function getLayout(): NavLayout {
  return typeof window !== "undefined" && window.innerWidth >= MD_BREAKPOINT ? "side" : "bottom";
}

export function useResponsiveNav() {
  const [layout, setLayout] = useState<NavLayout>("bottom");
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLayout(getLayout());
    const observer = new ResizeObserver(() => setLayout(getLayout()));
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

  // Close drawer on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  const close = useCallback(() => setIsOpen(false), []);

  const isActive = useCallback(
    (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href)),
    [pathname]
  );

  return { layout, isOpen, toggle, close, isActive, items: NAV_ITEMS };
}
