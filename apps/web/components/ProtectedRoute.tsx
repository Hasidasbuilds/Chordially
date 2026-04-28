"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

type Role = "artist" | "admin" | "fan";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: Role;
}

// Minimal auth store — swap with real session/JWT logic
function useAuth(): { role: Role | null; loading: boolean } {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("chordially:role") as Role | null;
    setRole(stored);
    setLoading(false);
  }, []);

  return { role, loading };
}

const ROLE_HOME: Record<Role, string> = {
  artist: "/artist/dashboard",
  admin: "/admin/dashboard",
  fan: "/",
};

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!role) {
      router.replace(`/login?return=${encodeURIComponent(pathname)}`);
      return;
    }

    if (role !== requiredRole) {
      router.replace(ROLE_HOME[role]);
    }
  }, [role, loading, requiredRole, router, pathname]);

  if (loading || !role || role !== requiredRole) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="animate-pulse text-sm text-zinc-400">Checking access…</span>
      </div>
    );
  }

  return <>{children}</>;
}
