"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@src/context/auth-context";
import { canAccessRoute, homeRouteForRole } from "@src/utils/roles";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(`/sign-in?next=${encodeURIComponent(pathname || "/in")}`);
      return;
    }
    if (!canAccessRoute(role, pathname || "/in")) {
      router.replace(homeRouteForRole(role));
    }
  }, [isAuthenticated, isLoading, pathname, role, router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-surface-muted">
        Authenticating session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-surface-muted">
        Redirecting to sign in...
      </div>
    );
  }

  if (!canAccessRoute(role, pathname || "/in")) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-surface-muted">
        Redirecting to your station...
      </div>
    );
  }

  return <>{children}</>;
}
