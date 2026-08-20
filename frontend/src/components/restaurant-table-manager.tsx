"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { getErrorMessage } from "@/lib/api";
import { restaurantTableApi } from "@/lib/domain-api";
import {
  TABLE_STATUSES,
  type RestaurantTable,
  type TableStatus,
} from "@/lib/types";
import { useAuth } from "./auth-provider";

const statusLabels: Record<TableStatus, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  RESERVED: "Reserved",
  CLEANING: "Cleaning",
};

const statusStyles: Record<TableStatus, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  OCCUPIED: "bg-red-50 text-red-700 border-red-200",
  RESERVED: "bg-blue-50 text-blue-700 border-blue-200",
  CLEANING: "bg-amber-50 text-amber-800 border-amber-200",
};

const emptyForm = {
  tableNumber: "",
  capacity: "",
  status: "AVAILABLE" as TableStatus,
};

export function RestaurantTableManager() {
  const { token } = useAuth();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadTables = useCallback(async () => {
    if (!token) {
      return;
    }

    await Promise.resolve();
    setLoading(true);
    setError("");

    try {
      const response = await restaurantTableApi.list(token);
      setTables(response.data.tables);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadTables(), 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadTables]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const input = {
        tableNumber: Number(form.tableNumber),
        capacity: Number(form.capacity),
        status: form.status,
      };

      if (editingId) {
        await restaurantTableApi.update(token, editingId, input);
      } else {
        await restaurantTableApi.create(token, input);
      }

      resetForm();
      await loadTables();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (table: RestaurantTable) => {
    setEditingId(table.id);
    setForm({
      tableNumber: String(table.tableNumber),
      capacity: String(table.capacity),
      status: table.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const changeStatus = async (table: RestaurantTable, status: TableStatus) => {
    if (!token) {
      return;
    }

    setError("");

    try {
      await restaurantTableApi.updateStatus(token, table.id, status);
      await loadTables();
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    }
  };

  const removeTable = async (table: RestaurantTable) => {
    if (
      !token ||
      !window.confirm(`Delete restaurant table ${table.tableNumber}?`)
    ) {
      return;
    }

    setError("");

    try {
      await restaurantTableApi.remove(token, table.id);
      await loadTables();
    } catch (removeError) {
      setError(getErrorMessage(removeError));
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
            Floor operations
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            Restaurant tables
          </h1>
          <p className="mt-2 max-w-2xl text-zinc-600">
            Maintain table capacity and keep the current floor status accurate.
          </p>
        </div>
        <p className="text-sm text-zinc-500">{tables.length} tables configured</p>
      </div>

      {error ? (
        <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="mt-7 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-950">
          {editingId ? "Edit table" : "Add table"}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end"
        >
          <label className="block text-sm font-medium text-zinc-800">
            Table number
            <input
              type="number"
              min="1"
              max="9999"
              value={form.tableNumber}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  tableNumber: event.target.value,
                }))
              }
              required
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-600"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-800">
            Capacity
            <input
              type="number"
              min="1"
              max="100"
              value={form.capacity}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  capacity: event.target.value,
                }))
              }
              required
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-600"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-800">
            Status
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as TableStatus,
                }))
              }
              className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-amber-600"
            >
              {TABLE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Save" : "Add table"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      {loading ? (
        <p className="mt-7 text-sm text-zinc-500">Loading tables…</p>
      ) : tables.length === 0 ? (
        <div className="mt-7 rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500">
          No tables configured yet.
        </div>
      ) : (
        <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => (
            <article
              key={table.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Restaurant table
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-zinc-950">
                    Table {table.tableNumber}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    Capacity: {table.capacity}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[table.status]}`}
                >
                  {statusLabels[table.status]}
                </span>
              </div>

              <label className="mt-5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Change status
                <select
                  value={table.status}
                  onChange={(event) =>
                    void changeStatus(
                      table,
                      event.target.value as TableStatus,
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 outline-none focus:border-amber-600"
                >
                  {TABLE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => startEditing(table)}
                  className="text-sm font-medium text-amber-700 hover:text-amber-900"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void removeTable(table)}
                  className="text-sm font-medium text-red-700 hover:text-red-900"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
