"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@src/context/auth-context";
import { canAccessRoute, homeRouteForRole } from "@src/utils/roles";
import AppLoader from "@src/components/ui/AppLoader";

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
    return <AppLoader label="Authenticating session" />;
  }

  if (!isAuthenticated) {
    return <AppLoader label="Redirecting to sign in" />;
  }

  if (!canAccessRoute(role, pathname || "/in")) {
    return <AppLoader label="Redirecting to your station" />;
  }

  return <>{children}</>;
}
