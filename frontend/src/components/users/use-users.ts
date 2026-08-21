"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { getErrorMessage } from "@/lib/api";
import { userApi } from "@/lib/domain-api";
import type { Role, UserAccount } from "@/lib/types";
import {
  EMPTY_USER_FORM,
  type UserFilter,
  type UserFormState,
} from "./user-config";

// Keeps Admin user-management state and API mutations outside the page table.
export function useUsers() {
  const { refreshUser, token, user: currentUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [form, setForm] = useState<UserFormState>(EMPTY_USER_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<UserAccount | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<UserFilter>("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!token) {
      return;
    }

    await Promise.resolve();
    setLoading(true);

    try {
      const response = await userApi.list(token);
      setUsers(response.data.users);
    } catch (error) {
      toast.error(getErrorMessage(error), "Could not load users");
    } finally {
      setLoading(false);
    }
  }, [toast, token]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadUsers(), 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole = filter === "ALL" || user.role === filter;
      const matchesQuery =
        !normalizedQuery ||
        [user.name, user.email].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );

      return matchesRole && matchesQuery;
    });
  }, [filter, query, users]);

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_USER_FORM);
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

  const openEditForm = (user: UserAccount) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setFormOpen(true);
  };

  const saveUser = async () => {
    if (!token) {
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        const editingSelf = editingId === currentUser?.id;
        const input: {
          email: string;
          name: string;
          password?: string;
          role?: Role;
        } = {
          name: form.name,
          email: form.email,
        };

        if (!editingSelf) {
          input.role = form.role;
        }

        if (form.password) {
          input.password = form.password;
        }

        await userApi.update(token, editingId, input);
        toast.success(`${form.name} was updated.`, "User updated");

        if (editingSelf) {
          await refreshUser();
        }
      } else {
        await userApi.create(token, {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        });
        toast.success(`${form.name} can now sign in.`, "User added");
      }

      setFormOpen(false);
      resetForm();
      await loadUsers();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (user: UserAccount) => {
    if (user.id === currentUser?.id) {
      toast.info("You cannot delete your own account.", "Action unavailable");
      return;
    }

    setDeleteCandidate(user);
  };

  const confirmDelete = async () => {
    if (!token || !deleteCandidate) {
      return;
    }

    setDeleting(true);

    try {
      await userApi.remove(token, deleteCandidate.id);
      toast.success(`${deleteCandidate.name} was removed.`, "User deleted");
      setDeleteCandidate(null);
      await loadUsers();
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
    closeDeleteDialog,
    closeForm,
    confirmDelete,
    currentUserId: currentUser?.id ?? "",
    deleteCandidate,
    deleting,
    editingId,
    editingSelf: editingId === currentUser?.id,
    filter,
    filteredUsers,
    form,
    formOpen,
    loading,
    openCreateForm,
    openEditForm,
    query,
    requestDelete,
    saveUser,
    saving,
    setFilter,
    setForm,
    setQuery,
    users,
  };
}
