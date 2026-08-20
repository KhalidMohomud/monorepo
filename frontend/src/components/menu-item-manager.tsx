"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { getErrorMessage } from "@/lib/api";
import { categoryApi, menuItemApi } from "@/lib/domain-api";
import type { Category, MenuItem } from "@/lib/types";
import { useAuth } from "./auth-provider";

const emptyForm = {
  categoryId: "",
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  isAvailable: true,
};

export function MenuItemManager() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!token) {
      return;
    }

    await Promise.resolve();
    setLoading(true);
    setError("");

    try {
      const [menuResponse, categoryResponse] = await Promise.all([
        menuItemApi.list(token),
        isAdmin ? categoryApi.list(token) : Promise.resolve(null),
      ]);
      setMenuItems(menuResponse.data.menuItems);

      if (categoryResponse) {
        const nextCategories = categoryResponse.data.categories;
        setCategories(nextCategories);
        setForm((current) => ({
          ...current,
          categoryId: current.categoryId || nextCategories[0]?.id || "",
        }));
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, token]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadData(), 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id ?? "",
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !isAdmin) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const input = {
        categoryId: form.categoryId,
        name: form.name,
        description: form.description || null,
        price: form.price,
        imageUrl: form.imageUrl || null,
        isAvailable: form.isAvailable,
      };

      if (editingId) {
        await menuItemApi.update(token, editingId, input);
      } else {
        await menuItemApi.create(token, input);
      }

      resetForm();
      await loadData();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (menuItem: MenuItem) => {
    setEditingId(menuItem.id);
    setForm({
      categoryId: menuItem.categoryId,
      name: menuItem.name,
      description: menuItem.description ?? "",
      price: menuItem.price,
      imageUrl: menuItem.imageUrl ?? "",
      isAvailable: menuItem.isAvailable,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleAvailability = async (menuItem: MenuItem) => {
    if (!token || !isAdmin) {
      return;
    }

    setError("");

    try {
      await menuItemApi.update(token, menuItem.id, {
        isAvailable: !menuItem.isAvailable,
      });
      await loadData();
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    }
  };

  const removeMenuItem = async (menuItem: MenuItem) => {
    if (
      !token ||
      !isAdmin ||
      !window.confirm(`Delete “${menuItem.name}” from the menu?`)
    ) {
      return;
    }

    setError("");

    try {
      await menuItemApi.remove(token, menuItem.id);
      await loadData();
    } catch (removeError) {
      setError(getErrorMessage(removeError));
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className={isAdmin ? "grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]" : ""}>
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
            Restaurant menu
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            Menu items
          </h1>
          <p className="mt-2 max-w-2xl text-zinc-600">
            {isAdmin
              ? "Maintain pricing, categories, and availability."
              : "Available items for creating customer orders."}
          </p>

          {error ? (
            <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {loading ? (
            <p className="mt-7 text-sm text-zinc-500">Loading menu…</p>
          ) : menuItems.length === 0 ? (
            <div className="mt-7 rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500">
              No menu items are available.
            </div>
          ) : (
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {menuItems.map((menuItem) => (
                <article
                  key={menuItem.id}
                  className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                        {menuItem.category.name}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-zinc-950">
                        {menuItem.name}
                      </h2>
                    </div>
                    <p className="font-semibold text-zinc-950">
                      ${menuItem.price}
                    </p>
                  </div>
                  <p className="mt-3 min-h-10 text-sm leading-5 text-zinc-600">
                    {menuItem.description || "No description"}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        menuItem.isAvailable
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {menuItem.isAvailable ? "Available" : "Unavailable"}
                    </span>
                    {isAdmin ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void toggleAvailability(menuItem)}
                          className="text-xs font-medium text-zinc-600 hover:text-zinc-950"
                        >
                          {menuItem.isAvailable ? "Mark unavailable" : "Make available"}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditing(menuItem)}
                          className="text-xs font-medium text-amber-700 hover:text-amber-900"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeMenuItem(menuItem)}
                          className="text-xs font-medium text-red-700 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {isAdmin ? (
          <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-950">
              {editingId ? "Edit menu item" : "New menu item"}
            </h2>
            {categories.length === 0 ? (
              <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                Create a category before adding menu items.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <label className="block text-sm font-medium text-zinc-800">
                  Category
                  <select
                    value={form.categoryId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        categoryId: event.target.value,
                      }))
                    }
                    required
                    className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-amber-600"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
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
                    maxLength={120}
                    className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-600"
                  />
                </label>
                <label className="block text-sm font-medium text-zinc-800">
                  Price
                  <input
                    type="number"
                    min="0"
                    max="9999999999.99"
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        price: event.target.value,
                      }))
                    }
                    required
                    className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-600"
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
                    rows={3}
                    className="mt-2 w-full resize-none rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-600"
                  />
                </label>
                <label className="block text-sm font-medium text-zinc-800">
                  Image URL
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        imageUrl: event.target.value,
                      }))
                    }
                    maxLength={2048}
                    className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-600"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-800">
                  <input
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isAvailable: event.target.checked,
                      }))
                    }
                    className="size-4 accent-amber-700"
                  />
                  Available for ordering
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
            )}
          </aside>
        ) : null}
      </div>
    </main>
  );
}
