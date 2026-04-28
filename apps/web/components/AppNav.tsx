"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Discover", icon: "🎵" },
  { href: "/live", label: "Live", icon: "🔴" },
  { href: "/wallet", label: "Wallet", icon: "💸" },
  { href: "/profile", label: "Profile", icon: "🎤" },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex flex-col items-center gap-0.5 text-xs font-medium transition-colors
        ${active ? "text-violet-400" : "text-zinc-400 hover:text-zinc-100"}`}
    >
      <span className="text-xl leading-none">{item.icon}</span>
      {item.label}
    </Link>
  );
}

// Mobile: fixed bottom bar
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 flex justify-around border-t border-zinc-800 bg-zinc-950 px-2 py-3 md:hidden">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.href} item={item} active={pathname === item.href} />
      ))}
    </nav>
  );
}

// Desktop: left sidebar
export function SideNav() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex flex-col gap-1 w-52 shrink-0 border-r border-zinc-800 bg-zinc-950 px-4 py-8 min-h-screen">
      <span className="mb-6 text-lg font-bold text-violet-400">Chordially</span>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
            ${pathname === item.href ? "bg-violet-900/40 text-violet-300" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"}`}
        >
          <span>{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </aside>
  );
}
