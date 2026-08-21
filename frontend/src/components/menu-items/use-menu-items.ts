"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { getErrorMessage } from "@/lib/api";
import { categoryApi, menuItemApi } from "@/lib/domain-api";
import type { Category, MenuItem } from "@/lib/types";
import {
  EMPTY_MENU_ITEM_FORM,
  type MenuItemFormState,
} from "./menu-item-config";

// Keeps menu API state, role rules, search, and notifications out of the table.
export function useMenuItems() {
  const { token, user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === "ADMIN";
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<MenuItemFormState>(EMPTY_MENU_ITEM_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<MenuItem | null>(null);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token) {
      return;
    }

    await Promise.resolve();
    setLoading(true);

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
    } catch (error) {
      toast.error(getErrorMessage(error), "Could not load menu items");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, toast, token]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadData(), 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return menuItems;
    }

    return menuItems.filter((item) =>
      [item.name, item.description ?? "", item.category.name].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [menuItems, query]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_MENU_ITEM_FORM,
      categoryId: categories[0]?.id ?? "",
    });
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setFormOpen(false);
    resetForm();
  };

  const openCreateForm = () => {
    if (categories.length === 0) {
      toast.info(
        "Create a category before adding menu items.",
        "Category required",
      );
      return;
    }

    resetForm();
    setFormOpen(true);
  };

  const openEditForm = (item: MenuItem) => {
    setEditingId(item.id);
    setForm({
      categoryId: item.categoryId,
      name: item.name,
      description: item.description ?? "",
      price: item.price,
      imageUrl: item.imageUrl ?? "",
      isAvailable: item.isAvailable,
    });
    setFormOpen(true);
  };

  const saveMenuItem = async () => {
    if (!token || !isAdmin) {
      return;
    }

    setSaving(true);

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
        toast.success(`${form.name} was updated.`, "Menu item updated");
      } else {
        await menuItemApi.create(token, input);
        toast.success(`${form.name} was added to the menu.`, "Menu item added");
      }

      setFormOpen(false);
      resetForm();
      await loadData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    if (!token || !isAdmin) {
      return;
    }

    setUpdatingId(item.id);

    try {
      await menuItemApi.update(token, item.id, {
        isAvailable: !item.isAvailable,
      });
      toast.success(
        `${item.name} is now ${item.isAvailable ? "unavailable" : "available"}.`,
        "Availability updated",
      );
      await loadData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUpdatingId(null);
    }
  };

  const requestDelete = (item: MenuItem) => {
    setDeleteCandidate(item);
  };

  const confirmDelete = async () => {
    if (!token || !isAdmin || !deleteCandidate) {
      return;
    }

    setDeleting(true);

    try {
      await menuItemApi.remove(token, deleteCandidate.id);
      toast.success(`${deleteCandidate.name} was removed.`, "Menu item deleted");
      setDeleteCandidate(null);
      await loadData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const closeDeleteDialog = () => {
    if (!deleting) {
      setDeleteCandidate(null);
    }
  };

  return {
    categories,
    closeDeleteDialog,
    closeForm,
    confirmDelete,
    deleteCandidate,
    deleting,
    editingId,
    filteredItems,
    form,
    formOpen,
    isAdmin,
    loading,
    menuItems,
    openCreateForm,
    openEditForm,
    query,
    requestDelete,
    saveMenuItem,
    saving,
    setForm,
    setQuery,
    toggleAvailability,
    updatingId,
  };
}
