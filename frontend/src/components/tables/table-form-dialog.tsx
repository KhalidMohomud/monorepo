import type { FormEvent } from "react";

import { TABLE_STATUSES, type TableStatus } from "@/lib/types";
import { Icon } from "../icon";
import {
  TABLE_STATUS_LABELS,
  type TableFormState,
} from "./table-config";

type TableFormDialogProps = {
  editing: boolean;
  form: TableFormState;
  onChange: (form: TableFormState) => void;
  onClose: () => void;
  onSubmit: () => void;
  open: boolean;
  saving: boolean;
};

// The dialog owns form presentation; API mutation remains in the manager.
export function TableFormDialog({
  editing,
  form,
  onChange,
  onClose,
  onSubmit,
  open,
  saving,
}: TableFormDialogProps) {
  if (!open) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close table form"
        onClick={onClose}
        className="absolute inset-0 bg-[#211c16]/35 backdrop-blur-[1px]"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="table-form-title"
        className="relative w-full rounded-t-2xl bg-white p-6 shadow-2xl sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="table-form-title"
              className="text-xl font-bold text-[#2d2925]"
            >
              {editing ? "Edit table" : "Add table"}
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Set the table number, seating capacity, and floor status.
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

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-stone-700">
              Table number
              <input
                type="number"
                min="1"
                max="9999"
                value={form.tableNumber}
                onChange={(event) =>
                  onChange({ ...form, tableNumber: event.target.value })
                }
                required
                autoFocus
                className="mt-2 h-11 w-full rounded-lg border border-stone-300 px-3 outline-none transition focus:border-amber-600 focus:ring-3 focus:ring-amber-100"
              />
            </label>
            <label className="block text-sm font-semibold text-stone-700">
              Capacity
              <input
                type="number"
                min="1"
                max="100"
                value={form.capacity}
                onChange={(event) =>
                  onChange({ ...form, capacity: event.target.value })
                }
                required
                className="mt-2 h-11 w-full rounded-lg border border-stone-300 px-3 outline-none transition focus:border-amber-600 focus:ring-3 focus:ring-amber-100"
              />
            </label>
          </div>
          <label className="block text-sm font-semibold text-stone-700">
            Status
            <select
              value={form.status}
              onChange={(event) =>
                onChange({
                  ...form,
                  status: event.target.value as TableStatus,
                })
              }
              className="mt-2 h-11 w-full rounded-lg border border-stone-300 bg-white px-3 outline-none transition focus:border-amber-600 focus:ring-3 focus:ring-amber-100"
            >
              {TABLE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {TABLE_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
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
              className="h-11 rounded-lg bg-[#eda735] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#d99729] disabled:opacity-60"
            >
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Table"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
