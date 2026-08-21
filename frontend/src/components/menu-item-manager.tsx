"use client";

import { ConfirmDialog } from "./confirm-dialog";
import { Icon } from "./icon";
import { MenuItemFormDialog } from "./menu-items/menu-item-form-dialog";
import { MenuItemTable } from "./menu-items/menu-item-table";
import { useMenuItems } from "./menu-items/use-menu-items";

// Composes Menu Items from table, form, confirmation, and data modules.
export function MenuItemManager() {
  const menuState = useMenuItems();

  return (
    <main className="min-h-[calc(100vh-3.5rem)] px-4 py-6 sm:px-6 lg:px-7 lg:py-8">
      <div className="mx-auto max-w-[1380px]">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a66d18]">
              Restaurant menu
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900">
              Menu Items
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-stone-600">
              {menuState.isAdmin
                ? "Maintain pricing, categories, and ordering availability."
                : "Browse menu items currently available for customer orders."}
            </p>
          </div>
          {menuState.isAdmin ? (
            <button
              type="button"
              onClick={menuState.openCreateForm}
              className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-lg bg-[#eda735] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#d99729] sm:self-auto"
            >
              <Icon name="plus" className="size-4" />
              Add Menu Item
            </button>
          ) : null}
        </div>

        <div className="mt-7">
          <MenuItemTable
            isAdmin={menuState.isAdmin}
            items={menuState.filteredItems}
            loading={menuState.loading}
            onAdd={menuState.openCreateForm}
            onDelete={menuState.requestDelete}
            onEdit={menuState.openEditForm}
            onQueryChange={menuState.setQuery}
            onToggleAvailability={(item) =>
              void menuState.toggleAvailability(item)
            }
            query={menuState.query}
            totalItemCount={menuState.menuItems.length}
            updatingId={menuState.updatingId}
          />
        </div>
      </div>

      {menuState.isAdmin ? (
        <>
          <MenuItemFormDialog
            categories={menuState.categories}
            editing={menuState.editingId !== null}
            form={menuState.form}
            imageFile={menuState.imageFile}
            imagePreview={menuState.imagePreview}
            onChange={menuState.setForm}
            onClose={menuState.closeForm}
            onImageChange={menuState.selectImage}
            onSubmit={() => void menuState.saveMenuItem()}
            open={menuState.formOpen}
            saving={menuState.saving}
          />
          <ConfirmDialog
            title="Delete menu item?"
            description={
              menuState.deleteCandidate
                ? `${menuState.deleteCandidate.name} will be removed from the menu. Items linked to order history may be protected.`
                : "This menu item will be permanently removed."
            }
            loading={menuState.deleting}
            onCancel={menuState.closeDeleteDialog}
            onConfirm={() => void menuState.confirmDelete()}
            open={menuState.deleteCandidate !== null}
          />
        </>
      ) : null}
    </main>
  );
}
