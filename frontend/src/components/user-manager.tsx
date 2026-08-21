"use client";

import { ConfirmDialog } from "./confirm-dialog";
import { Icon } from "./icon";
import { UserFormDialog } from "./users/user-form-dialog";
import { UserTable } from "./users/user-table";
import { useUsers } from "./users/use-users";

// Composes Admin Users from table, form, confirmation, and data modules.
export function UserManager() {
  const userState = useUsers();

  return (
    <main className="min-h-[calc(100vh-3.5rem)] px-4 py-6 sm:px-6 lg:px-7 lg:py-8">
      <div className="mx-auto max-w-[1380px]">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a66d18]">
              Team access
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900">
              Users
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-stone-600">
              Manage staff accounts, administrator access, and credentials.
            </p>
          </div>
          <button
            type="button"
            onClick={userState.openCreateForm}
            className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-lg bg-[#eda735] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#d99729] sm:self-auto"
          >
            <Icon name="plus" className="size-4" />
            Add User
          </button>
        </div>

        <div className="mt-7">
          <UserTable
            currentUserId={userState.currentUserId}
            filter={userState.filter}
            loading={userState.loading}
            onAdd={userState.openCreateForm}
            onDelete={userState.requestDelete}
            onEdit={userState.openEditForm}
            onFilterChange={userState.setFilter}
            onQueryChange={userState.setQuery}
            query={userState.query}
            totalUserCount={userState.users.length}
            users={userState.filteredUsers}
          />
        </div>
      </div>

      <UserFormDialog
        editing={userState.editingId !== null}
        editingSelf={userState.editingSelf}
        form={userState.form}
        onChange={userState.setForm}
        onClose={userState.closeForm}
        onSubmit={() => void userState.saveUser()}
        open={userState.formOpen}
        saving={userState.saving}
      />

      <ConfirmDialog
        title="Delete user?"
        description={
          userState.deleteCandidate
            ? `${userState.deleteCandidate.name} will lose access immediately after their current token expires. Users linked to order history cannot be deleted.`
            : "This user account will be permanently removed."
        }
        loading={userState.deleting}
        onCancel={userState.closeDeleteDialog}
        onConfirm={() => void userState.confirmDelete()}
        open={userState.deleteCandidate !== null}
      />
    </main>
  );
}
