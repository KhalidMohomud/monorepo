"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "./auth-provider";
import { LoadingCircle } from "./loading-circle";

export function ProtectedPage({
  adminOnly = false,
  children,
}: {
  adminOnly?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const { status, user } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6">
        <LoadingCircle label="Checking your session…" />
      </main>
    );
  }

  if (adminOnly && user?.role !== "ADMIN") {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-zinc-950">Access denied</h1>
        <p className="mt-2 text-zinc-600">
          This area is available to administrators only.
        </p>
      </main>
    );
  }

  return children;
}
