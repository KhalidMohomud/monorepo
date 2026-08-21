import type { FormEvent } from "react";

import type { Category } from "@/lib/types";
import { Icon } from "../icon";
import type { MenuItemFormState } from "./menu-item-config";

type MenuItemFormDialogProps = {
  categories: Category[];
  editing: boolean;
  form: MenuItemFormState;
  imageFile: File | null;
  imagePreview: string;
  onChange: (form: MenuItemFormState) => void;
  onClose: () => void;
  onImageChange: (file: File | null) => void;
  onSubmit: () => void;
  open: boolean;
  saving: boolean;
};

// Menu item create and edit share one focused modal form.
export function MenuItemFormDialog({
  categories,
  editing,
  form,
  imageFile,
  imagePreview,
  onChange,
  onClose,
  onImageChange,
  onSubmit,
  open,
  saving,
}: MenuItemFormDialogProps) {
  if (!open) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close menu item form"
        className="absolute inset-0 bg-[#211c16]/40 backdrop-blur-[1px]"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-item-form-title"
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:max-w-2xl sm:rounded-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a66d18]">
              Restaurant menu
            </p>
            <h2
              id="menu-item-form-title"
              className="mt-2 text-2xl font-bold text-stone-900"
            >
              {editing ? "Edit menu item" : "Add menu item"}
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Set the menu details, price, and ordering availability.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-bold text-stone-700">
              Item name
              <input
                value={form.name}
                onChange={(event) =>
                  onChange({ ...form, name: event.target.value })
                }
                required
                maxLength={120}
                autoFocus
                placeholder="e.g. Grilled Salmon"
                className="mt-2 h-12 w-full rounded-xl border border-stone-300 px-4 outline-none transition placeholder:text-stone-400 focus:border-amber-600 focus:ring-3 focus:ring-amber-100"
              />
            </label>
            <label className="block text-sm font-bold text-stone-700">
              Category
              <select
                value={form.categoryId}
                onChange={(event) =>
                  onChange({ ...form, categoryId: event.target.value })
                }
                required
                className="mt-2 h-12 w-full rounded-xl border border-stone-300 bg-white px-4 outline-none transition focus:border-amber-600 focus:ring-3 focus:ring-amber-100"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-bold text-stone-700">
              Price
              <span className="relative mt-2 block">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-500">
                  $
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="9999999999.99"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    onChange({ ...form, price: event.target.value })
                  }
                  required
                  placeholder="0.00"
                  className="h-12 w-full rounded-xl border border-stone-300 pl-8 pr-4 outline-none transition placeholder:text-stone-400 focus:border-amber-600 focus:ring-3 focus:ring-amber-100"
                />
              </span>
            </label>
            <div>
              <p className="text-sm font-bold text-stone-700">
                Item image{" "}
                <span className="font-normal text-stone-400">(optional)</span>
              </p>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-stone-300 p-3">
                <span
                  className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-[#f7ead5] bg-cover bg-center text-amber-800"
                  style={
                    imagePreview
                      ? { backgroundImage: `url(${JSON.stringify(imagePreview)})` }
                      : undefined
                  }
                >
                  {!imagePreview ? (
                    <Icon name="utensils" className="size-6" />
                  ) : null}
                </span>
                <div className="min-w-0 flex-1">
                  <label className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-stone-300 px-3 text-xs font-bold text-stone-700 hover:bg-stone-50">
                    Choose Image
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) =>
                        onImageChange(event.target.files?.[0] ?? null)
                      }
                      className="sr-only"
                    />
                  </label>
                  <p className="mt-1.5 truncate text-xs text-stone-500">
                    {imageFile?.name ?? "JPEG, PNG or WebP · max 5 MB"}
                  </p>
                  {imagePreview ? (
                    <button
                      type="button"
                      onClick={() => onImageChange(null)}
                      className="mt-1 text-xs font-bold text-red-700"
                    >
                      Remove image
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <label className="block text-sm font-bold text-stone-700">
            Description <span className="font-normal text-stone-400">(optional)</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                onChange({ ...form, description: event.target.value })
              }
              maxLength={500}
              rows={4}
              placeholder="Describe ingredients or preparation."
              className="mt-2 w-full resize-none rounded-xl border border-stone-300 px-4 py-3 outline-none transition placeholder:text-stone-400 focus:border-amber-600 focus:ring-3 focus:ring-amber-100"
            />
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-stone-200 bg-[#faf8f5] p-4">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(event) =>
                onChange({ ...form, isAvailable: event.target.checked })
              }
              className="mt-0.5 size-4 accent-[#d58e23]"
            />
            <span>
              <span className="block text-sm font-bold text-stone-800">
                Available for ordering
              </span>
              <span className="mt-0.5 block text-xs text-stone-500">
                Staff can add this item to new orders.
              </span>
            </span>
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-stone-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-11 rounded-lg border border-stone-300 px-5 text-sm font-bold text-stone-700 hover:bg-stone-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-11 rounded-lg bg-[#eda735] px-6 text-sm font-bold text-white shadow-sm hover:bg-[#d99729] disabled:opacity-60"
            >
              {saving
                ? "Saving…"
                : editing
                  ? "Save Changes"
                  : "Add Menu Item"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
