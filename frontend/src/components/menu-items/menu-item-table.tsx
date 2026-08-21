import type { MenuItem } from "@/lib/types";
import { Icon } from "../icon";

type MenuItemTableProps = {
  isAdmin: boolean;
  items: MenuItem[];
  loading: boolean;
  onAdd: () => void;
  onDelete: (item: MenuItem) => void;
  onEdit: (item: MenuItem) => void;
  onQueryChange: (query: string) => void;
  onToggleAvailability: (item: MenuItem) => void;
  query: string;
  totalItemCount: number;
  updatingId: string | null;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function LoadingRows({ colSpan }: { colSpan: number }) {
  return Array.from({ length: 4 }, (_, index) => (
    <tr key={index} className="border-t border-stone-200">
      <td className="px-5 py-5" colSpan={colSpan}>
        <div className="h-5 animate-pulse rounded bg-stone-100" />
      </td>
    </tr>
  ));
}

// MenuItemTable presents searchable inventory while role checks control actions.
export function MenuItemTable({
  isAdmin,
  items,
  loading,
  onAdd,
  onDelete,
  onEdit,
  onQueryChange,
  onToggleAvailability,
  query,
  totalItemCount,
  updatingId,
}: MenuItemTableProps) {
  const columnCount = isAdmin ? 6 : 5;

  if (!loading && totalItemCount === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-[#d8cec2] bg-white px-6 py-16 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
          <Icon name="utensils" className="size-6" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-stone-900">
          No menu items yet
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          {isAdmin
            ? "Add the first item to start building your restaurant menu."
            : "No menu items are currently available for ordering."}
        </p>
        {isAdmin ? (
          <button
            type="button"
            onClick={onAdd}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#eda735] px-5 text-sm font-bold text-white hover:bg-[#d99729]"
          >
            <Icon name="plus" className="size-4" />
            Add Menu Item
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e1d9cf] bg-white shadow-[0_5px_18px_rgba(62,46,27,0.05)]">
      <div className="flex flex-col gap-4 border-b border-[#e7e0d7] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-stone-900">Menu inventory</h2>
          <p className="mt-0.5 text-xs text-stone-500">
            {totalItemCount} {totalItemCount === 1 ? "item" : "items"}
          </p>
        </div>
        <label className="relative block w-full sm:max-w-xs">
          <span className="sr-only">Search menu items</span>
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search item or category..."
            className="h-10 w-full rounded-lg border border-stone-300 bg-[#fcfbf9] pl-9 pr-3 text-sm outline-none focus:border-amber-600 focus:ring-3 focus:ring-amber-100"
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead className="bg-[#faf8f5] text-xs font-bold uppercase tracking-wider text-stone-500">
            <tr>
              <th className="px-5 py-3.5">Menu item</th>
              <th className="px-5 py-3.5">Category</th>
              <th className="px-5 py-3.5">Price</th>
              <th className="px-5 py-3.5">Availability</th>
              <th className="px-5 py-3.5">Updated</th>
              {isAdmin ? (
                <th className="px-5 py-3.5 text-right">Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRows colSpan={columnCount} />
            ) : items.length === 0 ? (
              <tr className="border-t border-stone-200">
                <td colSpan={columnCount} className="px-5 py-12 text-center">
                  <p className="font-bold text-stone-800">No matching items</p>
                  <button
                    type="button"
                    onClick={() => onQueryChange("")}
                    className="mt-2 text-sm font-bold text-amber-700 hover:text-amber-900"
                  >
                    Clear search
                  </button>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-stone-200 transition hover:bg-[#fffcf7]"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(145deg,#fff3dc,#f8dfb1)] bg-cover bg-center font-bold text-amber-800"
                        style={
                          item.imageUrl
                            ? {
                                backgroundImage: `url(${JSON.stringify(item.imageUrl)})`,
                              }
                            : undefined
                        }
                      >
                        {!item.imageUrl
                          ? item.name.charAt(0).toUpperCase()
                          : null}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-stone-900">{item.name}</p>
                        <p className="mt-0.5 max-w-[260px] truncate text-xs text-stone-500">
                          {item.description || "No description"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-stone-700">
                    {item.category.name}
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-stone-900">
                    {currencyFormatter.format(Number(item.price))}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      disabled={!isAdmin || updatingId === item.id}
                      onClick={() => onToggleAvailability(item)}
                      title={isAdmin ? "Change availability" : undefined}
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        item.isAvailable
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-stone-100 text-stone-500"
                      } ${isAdmin ? "hover:ring-2 hover:ring-stone-200" : "cursor-default"}`}
                    >
                      {updatingId === item.id
                        ? "Updating…"
                        : item.isAvailable
                          ? "Available"
                          : "Unavailable"}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-sm text-stone-500">
                    {dateFormatter.format(new Date(item.updatedAt))}
                  </td>
                  {isAdmin ? (
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-stone-300 px-3 text-xs font-bold text-stone-700 hover:bg-stone-50"
                        >
                          <Icon name="pencil" className="size-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-bold text-red-700 hover:bg-red-50"
                        >
                          <Icon name="trash" className="size-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
