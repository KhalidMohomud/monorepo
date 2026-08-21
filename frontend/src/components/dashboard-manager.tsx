"use client";

import { ActiveOrderStatus } from "./dashboard/active-order-status";
import { DashboardQuickActions } from "./dashboard/dashboard-quick-actions";
import { DashboardSummary } from "./dashboard/dashboard-summary";
import { RecentOrders } from "./dashboard/recent-orders";
import { useDashboard } from "./dashboard/use-dashboard";
import { LoadingCircle } from "./loading-circle";

// Dashboard composition stays separate from data loading and individual panels.
export function DashboardManager() {
  const { dashboard, loading, user } = useDashboard();

  return (
    <main className="min-h-[calc(100vh-3.5rem)] px-4 py-7 sm:px-6 lg:px-7 lg:py-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
              Welcome, {user?.name.split(" ")[0] ?? "Team"}
            </h1>
            <p className="mt-2 text-base text-stone-600">
              Here is the current status of the restaurant floor.
            </p>
          </div>
          <time
            dateTime={new Date().toISOString()}
            suppressHydrationWarning
            className="text-sm font-bold text-stone-600"
          >
            {new Intl.DateTimeFormat("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }).format(new Date())}
          </time>
        </header>

        {loading && !dashboard ? (
          <section className="flex min-h-[520px] items-center justify-center">
            <LoadingCircle label="Loading restaurant overview…" />
          </section>
        ) : (
          <>

            <div className="mt-7">
              <DashboardSummary dashboard={dashboard} loading={loading} />
            </div>

            <div className="mt-7 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-7">
                <ActiveOrderStatus dashboard={dashboard} loading={loading} />
                <RecentOrders
                  loading={loading}
                  orders={dashboard?.recentOrders ?? []}
                />
              </div>
              <DashboardQuickActions />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
