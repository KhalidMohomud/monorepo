import { Icon, type IconName } from "@/components/icon";
import type { DashboardOverview } from "@/lib/types";
import { orderStatusLabel } from "@/components/orders/order-config";

type ActiveOrderStatusProps = {
  dashboard: DashboardOverview | null;
  loading: boolean;
};

const statuses = [
  { status: "PENDING", icon: "history", accent: "border-stone-300 text-stone-500" },
  { status: "PREPARING", icon: "utensils", accent: "border-l-[#eda735] text-amber-700" },
  { status: "READY", icon: "shop", accent: "border-l-emerald-700 text-emerald-700" },
  { status: "SERVED", icon: "check", accent: "border-l-indigo-600 text-indigo-700" },
] as const satisfies ReadonlyArray<{
  status: keyof DashboardOverview["activeOrdersByStatus"];
  icon: IconName;
  accent: string;
}>;

export function ActiveOrderStatus({
  dashboard,
  loading,
}: ActiveOrderStatusProps) {
  return (
    <section>
      <h2 className="text-2xl font-extrabold text-stone-900">
        Active Orders by Status
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statuses.map(({ status, icon, accent }) => (
          <article
            key={status}
            className={`flex min-h-28 flex-col items-center justify-center rounded-xl border border-[#e4ddd4] border-l-4 bg-white p-4 text-center shadow-sm ${accent}`}
          >
            <Icon name={icon} className="size-5" />
            {loading ? (
              <div className="mt-3 h-6 w-8 animate-pulse rounded bg-stone-100" />
            ) : (
              <p className="mt-2 text-2xl font-extrabold text-stone-900">
                {dashboard?.activeOrdersByStatus[status] ?? 0}
              </p>
            )}
            <p className="mt-0.5 text-xs font-bold text-stone-600">
              {orderStatusLabel[status]}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
