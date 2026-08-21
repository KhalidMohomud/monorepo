import type { Category } from "@/lib/types";
import { Icon } from "../icon";

type CategoryTableProps = {
  categories: Category[];
  loading: boolean;
  onDelete: (category: Category) => void;
  onEdit: (category: Category) => void;
  onAdd: () => void;
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function LoadingRows() {
  return Array.from({ length: 3 }, (_, index) => (
    <tr key={index} className="border-t border-stone-200">
      <td className="px-5 py-5" colSpan={5}>
        <div className="h-5 animate-pulse rounded bg-stone-100" />
      </td>
    </tr>
  ));
}

// A real table makes category inventory faster to scan than stacked cards.
export function CategoryTable({
  categories,
  loading,
  onAdd,
  onDelete,
  onEdit,
}: CategoryTableProps) {
  if (!loading && categories.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-[#d8cec2] bg-white px-6 py-16 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
          <Icon name="receipt" className="size-6" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-stone-900">
          No categories yet
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Create the first category to organize your restaurant menu.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#eda735] px-5 text-sm font-bold text-white hover:bg-[#d99729]"
        >
          <Icon name="plus" className="size-4" />
          Add Category
        </button>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e1d9cf] bg-white shadow-[0_5px_18px_rgba(62,46,27,0.05)]">
      <div className="flex items-center justify-between border-b border-[#e7e0d7] px-5 py-4">
        <div>
          <h2 className="font-bold text-stone-900">Category list</h2>
          <p className="mt-0.5 text-xs text-stone-500">
            {categories.length} {categories.length === 1 ? "category" : "categories"}
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
          {categories.reduce((sum, category) => sum + category.menuItemCount, 0)} menu items
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead className="bg-[#faf8f5] text-xs font-bold uppercase tracking-wider text-stone-500">
            <tr>
              <th className="px-5 py-3.5">Category</th>
              <th className="px-5 py-3.5">Description</th>
              <th className="px-5 py-3.5">Menu items</th>
              <th className="px-5 py-3.5">Updated</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRows />
            ) : (
              categories.map((category) => (
                <tr
                  key={category.id}
                  className="border-t border-stone-200 transition hover:bg-[#fffcf7]"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 font-bold text-amber-800">
                        {category.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="font-bold text-stone-900">
                        {category.name}
                      </span>
                    </div>
                  </td>
                  <td className="max-w-xs px-5 py-4 text-sm text-stone-600">
                    <p className="truncate">
                      {category.description || "No description"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-700">
                      {category.menuItemCount}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-stone-500">
                    {dateFormatter.format(new Date(category.updatedAt))}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(category)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-stone-300 px-3 text-xs font-bold text-stone-700 hover:bg-stone-50"
                      >
                        <Icon name="pencil" className="size-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(category)}
                        aria-disabled={category.menuItemCount > 0}
                        title={
                          category.menuItemCount > 0
                            ? "Remove menu items before deleting this category"
                            : `Delete ${category.name}`
                        }
                        className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold ${
                          category.menuItemCount > 0
                            ? "border-stone-200 text-stone-400"
                            : "border-red-200 text-red-700 hover:bg-red-50"
                        }`}
                      >
                        <Icon name="trash" className="size-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
