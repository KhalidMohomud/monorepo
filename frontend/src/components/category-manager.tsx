"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { getErrorMessage } from "@/lib/api";
import { categoryApi } from "@/lib/domain-api";
import type { Category } from "@/lib/types";
import { useAuth } from "./auth-provider";

const emptyForm = { name: "", description: "" };

export function CategoryManager() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadCategories = useCallback(async () => {
    if (!token) {
      return;
    }

    await Promise.resolve();
    setLoading(true);
    setError("");

    try {
      const response = await categoryApi.list(token);
      setCategories(response.data.categories);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadCategories(), 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadCategories]);

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
        name: form.name,
        description: form.description || null,
      };

      if (editingId) {
        await categoryApi.update(token, editingId, input);
      } else {
        await categoryApi.create(token, input);
      }

      resetForm();
      await loadCategories();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      description: category.description ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeCategory = async (category: Category) => {
    if (
      !token ||
      !window.confirm(`Delete the “${category.name}” category?`)
    ) {
      return;
    }

    setError("");

    try {
      await categoryApi.remove(token, category.id);
      await loadCategories();
    } catch (removeError) {
      setError(getErrorMessage(removeError));
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
            Menu setup
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            Categories
          </h1>
          <p className="mt-2 max-w-2xl text-zinc-600">
            Organize menu items into clear sections for staff and customers.
          </p>

          {error ? (
            <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="mt-7 overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {loading ? (
              <p className="p-5 text-sm text-zinc-500">Loading categories…</p>
            ) : categories.length === 0 ? (
              <p className="p-5 text-sm text-zinc-500">
                No categories yet. Create the first one using the form.
              </p>
            ) : (
              <ul className="divide-y divide-zinc-200">
                {categories.map((category) => (
                  <li
                    key={category.id}
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h2 className="font-semibold text-zinc-950">
                        {category.name}
                      </h2>
                      <p className="mt-1 text-sm text-zinc-600">
                        {category.description || "No description"}
                      </p>
                      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
                        {category.menuItemCount} menu items
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEditing(category)}
                        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeCategory(category)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-950">
            {editingId ? "Edit category" : "New category"}
          </h2>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-zinc-800">
              Name
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
                maxLength={100}
                className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              />
            </label>
            <label className="block text-sm font-medium text-zinc-800">
              Description
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                maxLength={500}
                rows={4}
                className="mt-2 w-full resize-none rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
              >
                {saving ? "Saving…" : editingId ? "Save changes" : "Create"}
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
        </aside>
      </div>
    </main>
  );
}
