import { Icon } from "@/components/icon";
import type { OrderView } from "./use-orders";

type OrderToolbarProps = {
  canViewHistory: boolean;
  onQueryChange: (query: string) => void;
  onViewChange: (view: OrderView) => void;
  query: string;
  view: OrderView;
};

export function OrderToolbar({
  canViewHistory,
  onQueryChange,
  onViewChange,
  query,
  view,
}: OrderToolbarProps) {
  return (
    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {canViewHistory ? (
        <div className="inline-flex self-start rounded-xl border border-[#ded4c7] bg-white p-1">
          {(["ACTIVE", "HISTORY"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onViewChange(option)}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                view === option
                  ? "bg-stone-900 text-white"
                  : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              {option === "ACTIVE" ? "Active Orders" : "Order History"}
            </button>
          ))}
        </div>
      ) : null}

      <label className="relative block w-full sm:max-w-sm">
        <span className="sr-only">Search orders</span>
        <Icon
          name="search"
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search order, table, or status..."
          className="h-11 w-full rounded-xl border border-[#d9cfc3] bg-white pl-10 pr-10 text-sm outline-none transition placeholder:text-stone-400 focus:border-[#d69a37] focus:ring-3 focus:ring-amber-100"
        />
        {query ? (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label="Clear order search"
            className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <Icon name="close" className="size-4" />
          </button>
        ) : null}
      </label>
    </div>
  );
}
