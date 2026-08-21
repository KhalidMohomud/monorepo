"use client";

import { CategoryFormDialog } from "./categories/category-form-dialog";
import { CategoryTable } from "./categories/category-table";
import { useCategories } from "./categories/use-categories";
import { ConfirmDialog } from "./confirm-dialog";
import { Icon } from "./icon";

// Composes the Category page from table, form, confirmation, and data modules.
export function CategoryManager() {
  const categoryState = useCategories();

  return (
    <main className="min-h-[calc(100vh-3.5rem)] px-4 py-6 sm:px-6 lg:px-7 lg:py-8">
      <div className="mx-auto max-w-[1380px]">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a66d18]">
              Menu setup
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900">
              Categories
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-stone-600">
              Organize menu items into clear sections for staff and customers.
            </p>
          </div>
          <button
            type="button"
            onClick={categoryState.openCreateForm}
            className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-lg bg-[#eda735] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#d99729] sm:self-auto"
          >
            <Icon name="plus" className="size-4" />
            Add Category
          </button>
        </div>

        <div className="mt-7">
          <CategoryTable
            categories={categoryState.categories}
            loading={categoryState.loading}
            onAdd={categoryState.openCreateForm}
            onDelete={categoryState.requestDelete}
            onEdit={categoryState.openEditForm}
          />
        </div>
      </div>

      <CategoryFormDialog
        editing={categoryState.editingId !== null}
        form={categoryState.form}
        onChange={categoryState.setForm}
        onClose={categoryState.closeForm}
        onSubmit={() => void categoryState.saveCategory()}
        open={categoryState.formOpen}
        saving={categoryState.saving}
      />

      <ConfirmDialog
        title="Delete category?"
        description={
          categoryState.deleteCandidate
            ? `${categoryState.deleteCandidate.name} will be permanently removed. This action cannot be undone.`
            : "This category will be permanently removed."
        }
        loading={categoryState.deleting}
        onCancel={categoryState.closeDeleteDialog}
        onConfirm={() => void categoryState.confirmDelete()}
        open={categoryState.deleteCandidate !== null}
      />
    </main>
  );
}
