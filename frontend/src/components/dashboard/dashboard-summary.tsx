import { Icon, type IconName } from "@/components/icon";
import type { DashboardOverview } from "@/lib/types";
import { formatCurrency } from "@/components/orders/order-config";

type DashboardSummaryProps = {
  dashboard: DashboardOverview | null;
  loading: boolean;
};

export function DashboardSummary({
  dashboard,
  loading,
}: DashboardSummaryProps) {
  const summary = dashboard?.summary;
  const capacity = summary?.totalTables
    ? Math.round((summary.occupiedTables / summary.totalTables) * 100)
    : 0;
  const cards: Array<{
    detail?: string;
    icon: IconName;
    label: string;
    tone: string;
    value: string;
  }> = [
    {
      label: "Occupied Tables",
      value: summary ? String(summary.occupiedTables) : "0",
      detail: summary ? `/ ${summary.totalTables}` : "/ 0",
      icon: "table",
      tone: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Active Orders",
      value: summary ? String(summary.activeOrders) : "0",
      icon: "receipt",
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Today's Orders",
      value: summary ? String(summary.todayOrders) : "0",
      icon: "chart",
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Today's Revenue",
      value: formatCurrency(summary?.todayRevenue ?? 0),
      icon: "grid",
      tone: "bg-teal-50 text-teal-700",
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <article
          key={card.label}
          className="min-h-40 rounded-xl border border-[#e1d9cf] bg-white p-5 shadow-[0_5px_18px_rgba(62,46,27,0.05)]"
        >
          <div className="flex items-start justify-between gap-3">
            <span className={`flex size-11 items-center justify-center rounded-full ${card.tone}`}>
              <Icon name={card.icon} className="size-5" />
            </span>
            {index === 0 ? (
              <span className="rounded-full bg-[#eee9e3] px-2.5 py-1 text-[10px] font-bold text-stone-600">
                Capacity: {capacity}%
              </span>
            ) : index === 1 ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                Live
              </span>
            ) : null}
          </div>
          <p className="mt-5 text-sm font-medium text-stone-600">{card.label}</p>
          {loading ? (
            <div className="mt-2 h-8 w-24 animate-pulse rounded bg-stone-100" />
          ) : (
            <p className="mt-1 text-3xl font-extrabold text-stone-900">
              {card.value}{" "}
              {card.detail ? (
                <span className="text-sm font-medium text-stone-500">
                  {card.detail}
                </span>
              ) : null}
            </p>
          )}
        </article>
      ))}
    </section>
  );
}
