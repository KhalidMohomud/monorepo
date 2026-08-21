"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { getErrorMessage } from "@/lib/api";
import type { Role } from "@/lib/types";

const landingPageForRole = (role: Role) =>
  role === "ADMIN" ? "/" : "/orders/new";

export default function LoginPage() {
  const router = useRouter();
  const { login, status, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(landingPageForRole(user.role));
    }
  }, [router, status, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const authenticatedUser = await login(email, password);
      router.replace(landingPageForRole(authenticatedUser.role));
    } catch (loginError) {
      setError(getErrorMessage(loginError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fbf8f4] px-5 py-10 sm:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_6%,rgba(245,184,93,0.30),transparent_34%),radial-gradient(circle_at_88%_88%,rgba(214,171,108,0.12),transparent_30%)]"
      />

      <section className="relative w-full max-w-[520px] rounded-2xl border border-stone-200/80 bg-white px-6 py-8 shadow-[0_24px_65px_rgba(81,57,28,0.11)] sm:px-10 sm:py-10">
        <div className="text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-xl border border-stone-200 bg-[#f3ede6] text-[#845b18] shadow-sm">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 3v6a3 3 0 0 0 6 0V3M8 3v18M16 3v18M16 10c2.7 0 4-1.6 4-4V3c-2.7 0-4 1.6-4 4v3Z" />
            </svg>
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-[#805717]">
            Merhaba Order Desk
          </h1>
          <p className="mt-3 text-base text-stone-600 sm:text-lg">
            Sign in to your account to manage operations.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5">
          <label className="block text-sm font-semibold text-stone-700">
            Email Address
            <span className="relative mt-2 block">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-stone-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                placeholder="staff@merhaba.test"
                className="h-14 w-full rounded-xl border border-stone-300 bg-white pl-12 pr-4 text-base font-normal text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#b87a19] focus:ring-4 focus:ring-amber-100"
              />
            </span>
          </label>

          <label className="block text-sm font-semibold text-stone-700">
            Password
            <span className="relative mt-2 block">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-stone-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5" y="10" width="14" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="h-14 w-full rounded-xl border border-stone-300 bg-white pl-12 pr-12 text-base font-normal text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#b87a19] focus:ring-4 focus:ring-amber-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {showPassword ? (
                    <>
                      <path d="m3 3 18 18" />
                      <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.4 10.4 0 0 1 12 4c5.5 0 9 6 9 6a17.8 17.8 0 0 1-2.2 2.9M6.2 6.2C4.2 7.6 3 10 3 10s3.5 6 9 6c1 0 2-.2 2.8-.5" />
                    </>
                  ) : (
                    <>
                      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </>
                  )}
                </svg>
              </button>
            </span>
          </label>

          <div className="flex items-center gap-2.5 text-sm text-stone-600">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-4 text-[#94661e]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            Your access remains active for this browser session.
          </div>

          {error ? (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting || status === "loading"}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#eba52d] px-4 text-base font-bold text-white shadow-sm transition hover:bg-[#d99420] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign In"}
            {!submitting ? (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            ) : null}
          </button>
        </form>

        <div className="mt-10 border-t border-stone-200 pt-6 text-center text-sm text-stone-600">
          Need an account?{" "}
          <span className="font-semibold text-[#805717]">
            Contact Administrator
          </span>
        </div>
      </section>
    </main>
  );
}
