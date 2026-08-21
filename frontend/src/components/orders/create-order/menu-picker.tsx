import { Icon } from "@/components/icon";
import type { MenuItem } from "@/lib/types";
import { formatCurrency } from "../order-config";

type MenuPickerProps = {
  categories: string[];
  category: string;
  items: MenuItem[];
  loading: boolean;
  onAdd: (item: MenuItem) => void;
  onCategoryChange: (category: string) => void;
  onQueryChange: (query: string) => void;
  query: string;
};

export function MenuPicker({
  categories,
  category,
  items,
  loading,
  onAdd,
  onCategoryChange,
  onQueryChange,
  query,
}: MenuPickerProps) {
  return (
    <section className="min-h-[480px] rounded-2xl border border-[#ded4c7] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onCategoryChange(item)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
              category === item
                ? "bg-stone-900 text-white"
                : "bg-[#eee8df] text-stone-600 hover:bg-[#e3d9cc]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <label className="mt-3 flex h-12 items-center gap-3 rounded-xl border border-[#d9cdbd] bg-[#fdfaf7] px-4 focus-within:border-[#d69a37]">
        <Icon name="search" className="size-5 shrink-0 text-stone-500" />
        <span className="sr-only">Search menu items</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search menu items..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-stone-400"
        />
      </label>

      <div className="mt-4 space-y-3">
        {loading ? (
          [0, 1, 2].map((item) => (
            <div key={item} className="h-[78px] animate-pulse rounded-xl bg-stone-100" />
          ))
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 px-5 py-12 text-center">
            <p className="font-bold text-stone-700">No available menu items</p>
            <p className="mt-1 text-sm text-stone-500">
              Try another category or search term.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-[#dfd3c4] bg-[#fffaf5] p-3"
            >
              <span
                className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-[#f1e3d0] bg-cover bg-center text-[#8a5d1d]"
                style={
                  item.imageUrl
                    ? {
                        backgroundImage: `url(${JSON.stringify(item.imageUrl)})`,
                      }
                    : undefined
                }
              >
                {!item.imageUrl ? (
                  <Icon name="utensils" className="size-6" />
                ) : null}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-bold text-stone-900">{item.name}</h3>
                <p className="mt-0.5 line-clamp-1 text-xs text-stone-600">
                  {item.description ?? item.category.name}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-extrabold text-stone-900">
                  {formatCurrency(item.price)}
                </p>
                <button
                  type="button"
                  onClick={() => onAdd(item)}
                  className="mt-1 rounded-md border border-[#d8cbbb] bg-white px-4 py-1.5 text-xs font-bold text-stone-700 hover:border-[#d69a37] hover:text-[#8a5d1d]"
                >
                  Add
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
