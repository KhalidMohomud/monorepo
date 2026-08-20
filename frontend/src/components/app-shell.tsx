"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { useAuth } from "./auth-provider";

const links = [
  { href: "/menu-items", label: "Menu", adminOnly: false },
  { href: "/categories", label: "Categories", adminOnly: true },
  { href: "/tables", label: "Tables", adminOnly: false },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, status, user } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (pathname === "/login") {
    return children;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="font-semibold tracking-tight text-zinc-950">
            Merhaba Order Desk
          </Link>

          {status === "authenticated" ? (
            <div className="flex flex-wrap items-center gap-2">
              <nav className="flex items-center gap-1" aria-label="Main navigation">
                {links
                  .filter((link) => !link.adminOnly || user?.role === "ADMIN")
                  .map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                        pathname === link.href
                          ? "bg-amber-100 text-amber-900"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
              </nav>
              <span className="hidden text-sm text-zinc-500 sm:inline">
                {user?.name} · {user?.role}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Sign out
              </button>
            </div>
          ) : pathname !== "/login" ? (
            <Link
              href="/login"
              className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
            >
              Sign in
            </Link>
          ) : null}
        </div>
      </header>
      {children}
    </div>
  );
}
