"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "./auth-provider";
import { LoadingCircle } from "./loading-circle";
import { landingPageForRole } from "@/lib/permissions";
import type { Role } from "@/lib/types";

export function ProtectedPage({
  allowedRoles,
  children,
}: {
  allowedRoles?: readonly Role[];
  children: ReactNode;
}) {
  const router = useRouter();
  const { status, user } = useAuth();
  const accessDenied =
    status === "authenticated" &&
    Boolean(allowedRoles) &&
    (!user || !allowedRoles?.includes(user.role));

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (accessDenied && user) {
      router.replace(landingPageForRole(user.role));
    }
  }, [accessDenied, router, status, user]);

  if (status === "loading" || status === "unauthenticated" || accessDenied) {
    return (
      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6">
        <LoadingCircle
          label={accessDenied ? "Redirecting…" : "Checking your session…"}
        />
      </main>
    );
  }

  return children;
}
