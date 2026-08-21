"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { useAuth } from "./auth-provider";
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
    router.push("/login");
  };

  if (pathname === "/login") {
    return children;
  }

  if (status !== "authenticated" || !user) {
    return (
      <div className="min-h-screen bg-[#faf8f5]">
        <header className="border-b border-[#e6ded3] bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-bold text-[#694817]">
              Merhaba Order Desk
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-[#eba42f] px-4 py-2 text-sm font-bold text-white"
            >
              Sign in
            </Link>
          </div>
        </header>
        {children}
      </div>
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
        <Topbar onMenuOpen={() => setMobileNavigationOpen(true)} />
        {children}
      </div>
    </div>
  );
}
