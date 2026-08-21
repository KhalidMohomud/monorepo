import type { FormEvent } from "react";

import { Icon } from "../icon";
import type { CategoryFormState } from "./category-config";

type CategoryFormDialogProps = {
  editing: boolean;
  form: CategoryFormState;
  onChange: (form: CategoryFormState) => void;
  onClose: () => void;
  onSubmit: () => void;
  open: boolean;
  saving: boolean;
};

// Category create and edit share one accessible modal form.
export function CategoryFormDialog({
  editing,
  form,
  onChange,
  onClose,
  onSubmit,
  open,
  saving,
}: CategoryFormDialogProps) {
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
        aria-label="Close category form"
        className="absolute inset-0 bg-[#211c16]/40 backdrop-blur-[1px]"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-form-title"
        className="relative w-full rounded-t-2xl bg-white p-6 shadow-2xl sm:max-w-xl sm:rounded-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a66d18]">
              Menu setup
            </p>
            <h2
              id="category-form-title"
              className="mt-2 text-2xl font-bold text-stone-900"
            >
              {editing ? "Edit category" : "Add category"}
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Use a clear name that staff can recognize quickly.
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
          <label className="block text-sm font-bold text-stone-700">
            Category name
            <input
              value={form.name}
              onChange={(event) =>
                onChange({ ...form, name: event.target.value })
              }
              required
              maxLength={100}
              autoFocus
              placeholder="e.g. Main Course"
              className="mt-2 h-12 w-full rounded-xl border border-stone-300 px-4 text-base outline-none transition placeholder:text-stone-400 focus:border-amber-600 focus:ring-3 focus:ring-amber-100"
            />
          </label>
          <label className="block text-sm font-bold text-stone-700">
            Description <span className="font-normal text-stone-400">(optional)</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                onChange({ ...form, description: event.target.value })
              }
              maxLength={500}
              rows={5}
              placeholder="Describe what belongs in this category."
              className="mt-2 w-full resize-none rounded-xl border border-stone-300 px-4 py-3 text-base outline-none transition placeholder:text-stone-400 focus:border-amber-600 focus:ring-3 focus:ring-amber-100"
            />
            <span className="mt-1 block text-right text-xs font-normal text-stone-400">
              {form.description.length}/500
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
                  : "Add Category"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
