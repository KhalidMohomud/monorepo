"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { getErrorMessage } from "@/lib/api";
import { categoryApi } from "@/lib/domain-api";
import type { Category } from "@/lib/types";
import {
  EMPTY_CATEGORY_FORM,
  type CategoryFormState,
} from "./category-config";

// Keeps Category API state and notifications outside presentation components.
export function useCategories() {
  const { token } = useAuth();
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryFormState>(EMPTY_CATEGORY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    if (!token) {
      return;
    }

    await Promise.resolve();
    setLoading(true);

    try {
      const response = await categoryApi.list(token);
      setCategories(response.data.categories);
    } catch (error) {
      toast.error(getErrorMessage(error), "Could not load categories");
    } finally {
      setLoading(false);
    }
  }, [toast, token]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadCategories(), 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadCategories]);

  const closeForm = () => {
    if (saving) {
      return;
    }

    setFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_CATEGORY_FORM);
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_CATEGORY_FORM);
    setFormOpen(true);
  };

  const openEditForm = (category: Category) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      description: category.description ?? "",
    });
    setFormOpen(true);
  };

  const saveCategory = async () => {
    if (!token) {
      return;
    }

    setSaving(true);

    try {
      const input = {
        name: form.name,
        description: form.description || null,
      };

      if (editingId) {
        await categoryApi.update(token, editingId, input);
        toast.success(`${form.name} was updated.`, "Category updated");
      } else {
        await categoryApi.create(token, input);
        toast.success(`${form.name} was added to the menu.`, "Category added");
      }

      setFormOpen(false);
      setEditingId(null);
      setForm(EMPTY_CATEGORY_FORM);
      await loadCategories();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (category: Category) => {
    if (category.menuItemCount > 0) {
      toast.info(
        `Move or delete the ${category.menuItemCount} menu item${category.menuItemCount === 1 ? "" : "s"} in ${category.name} first.`,
        "Category is in use",
      );
      return;
    }

    setDeleteCandidate(category);
  };

  const confirmDelete = async () => {
    if (!token || !deleteCandidate) {
      return;
    }

    setDeleting(true);

    try {
      await categoryApi.remove(token, deleteCandidate.id);
      toast.success(
        `${deleteCandidate.name} was removed.`,
        "Category deleted",
      );
      setDeleteCandidate(null);
      await loadCategories();
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
    form,
    formOpen,
    loading,
    openCreateForm,
    openEditForm,
    requestDelete,
    saveCategory,
    saving,
    setForm,
  };
}
