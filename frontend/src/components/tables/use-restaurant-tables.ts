"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { getErrorMessage } from "@/lib/api";
import { restaurantTableApi } from "@/lib/domain-api";
import type { RestaurantTable, TableStatus } from "@/lib/types";
import {
  EMPTY_TABLE_FORM,
  TABLE_STATUS_LABELS,
  type TableFilter,
  type TableFormState,
} from "./table-config";

// Keeps table API orchestration separate from the page's visual composition.
export function useRestaurantTables() {
  const { token } = useAuth();
  const toast = useToast();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [filter, setFilter] = useState<TableFilter>("ALL");
  const [form, setForm] = useState<TableFormState>(EMPTY_TABLE_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] =
    useState<RestaurantTable | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [menuTableId, setMenuTableId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadTables = useCallback(async () => {
    if (!token) {
      return;
    }

    await Promise.resolve();
    setLoading(true);

    try {
      const response = await restaurantTableApi.list(token);
      setTables(response.data.tables);
    } catch (error) {
      toast.error(getErrorMessage(error), "Could not load tables");
    } finally {
      setLoading(false);
    }
  }, [toast, token]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadTables(), 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadTables]);

  const filteredTables = useMemo(
    () =>
      filter === "ALL"
        ? tables
        : tables.filter((table) => table.status === filter),
    [filter, tables],
  );

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_TABLE_FORM);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setFormOpen(false);
    resetForm();
  };

  const openCreateForm = () => {
    resetForm();
    setFormOpen(true);
  };

  const startEditing = (table: RestaurantTable) => {
    setMenuTableId(null);
    setEditingId(table.id);
    setForm({
      tableNumber: String(table.tableNumber),
      capacity: String(table.capacity),
      status: table.status,
    });
    setFormOpen(true);
  };

  const saveTable = async () => {
    if (!token) {
      return;
    }

    setSaving(true);

    try {
      const input = {
        tableNumber: Number(form.tableNumber),
        capacity: Number(form.capacity),
        status: form.status,
      };

      if (editingId) {
        await restaurantTableApi.update(token, editingId, input);
        toast.success(
          `Table ${form.tableNumber} was updated.`,
          "Table updated",
        );
      } else {
        await restaurantTableApi.create(token, input);
        toast.success(
          `Table ${form.tableNumber} was added to the floor.`,
          "Table added",
        );
      }

      setFormOpen(false);
      resetForm();
      // Reload from the API so cards always reflect backend constraints.
      await loadTables();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (table: RestaurantTable, status: TableStatus) => {
    if (!token) {
      return;
    }

    setUpdatingId(table.id);

    try {
      await restaurantTableApi.updateStatus(token, table.id, status);
      toast.success(
        `Table ${table.tableNumber} is now ${TABLE_STATUS_LABELS[status].toLowerCase()}.`,
        "Status updated",
      );
      await loadTables();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUpdatingId(null);
    }
  };

  const requestDelete = (table: RestaurantTable) => {
    setMenuTableId(null);
    setDeleteCandidate(table);
  };

  const confirmDelete = async () => {
    if (!token || !deleteCandidate) {
      return;
    }

    setDeleting(true);

    try {
      await restaurantTableApi.remove(token, deleteCandidate.id);
      toast.success(
        `Table ${deleteCandidate.tableNumber} was removed.`,
        "Table deleted",
      );
      setDeleteCandidate(null);
      await loadTables();
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

  const toggleMenu = (tableId: string) => {
    setMenuTableId((current) => (current === tableId ? null : tableId));
  };

  return {
    closeForm,
    closeDeleteDialog,
    confirmDelete,
    deleteCandidate,
    deleting,
    editingId,
    filter,
    filteredTables,
    form,
    formOpen,
    loading,
    menuTableId,
    openCreateForm,
    requestDelete,
    saveTable,
    saving,
    setFilter,
    setForm,
    startEditing,
    tables,
    toggleMenu,
    updatingId,
    markAvailable: (table: RestaurantTable) =>
      changeStatus(table, "AVAILABLE"),
  };
}
