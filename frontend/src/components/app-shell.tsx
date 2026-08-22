"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { useAuth } from "./auth-provider";
import { LoadingCircle } from "./loading-circle";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

// AppShell only coordinates authentication state and the responsive layout.
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, status, user } = useAuth();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  useEffect(() => {
    if (pathname !== "/login" && status === "unauthenticated") {
      router.replace("/login");
    }
  }, [pathname, router, status]);

  if (pathname === "/login") {
    return children;
  }

  if (status !== "authenticated" || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf8f4] px-6">
        <LoadingCircle
          label={
            status === "loading" ? "Checking your session…" : "Opening sign in…"
          }
        />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf8f4] text-[#25221e]">
      <Sidebar
        mobileOpen={mobileNavigationOpen}
        onClose={() => setMobileNavigationOpen(false)}
        onLogout={handleLogout}
        pathname={pathname}
        role={user.role}
      />
      <div className="min-h-screen lg:pl-[248px]">
        <Topbar
          onMenuOpen={() => setMobileNavigationOpen(true)}
          role={user.role}
        />
        {children}
      </div>
    </div>
  );
}
