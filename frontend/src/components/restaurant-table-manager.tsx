"use client";

import { Icon } from "./icon";
import { ConfirmDialog } from "./confirm-dialog";
import { TableFilters } from "./tables/table-filters";
import { TableFormDialog } from "./tables/table-form-dialog";
import { TableGrid } from "./tables/table-grid";
import { useRestaurantTables } from "./tables/use-restaurant-tables";

// Composes the Tables page; data and mutation logic live in the dedicated hook.
export function RestaurantTableManager() {
  const tableState = useRestaurantTables();

  return (
    <main className="min-h-[calc(100vh-3.5rem)] px-4 py-6 sm:px-6 lg:px-7 lg:py-7">
      <div className="mx-auto max-w-[1380px]">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#292622]">
              Tables
            </h1>
            <p className="mt-1 text-sm text-[#696158]">
              Manage dining area seating and status.
            </p>
          </div>
          <button
            type="button"
            onClick={tableState.openCreateForm}
            className="flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-[#d9cfc3] bg-white px-5 text-sm font-bold text-[#302c27] shadow-sm transition hover:border-[#c7b7a2] hover:bg-[#fffdfa] sm:self-auto"
          >
            <Icon name="plus" className="size-4" />
            Add Table
          </button>
        </div>

        <TableFilters
          filter={tableState.filter}
          onChange={tableState.setFilter}
          tables={tableState.tables}
        />
        <TableGrid
          filter={tableState.filter}
          loading={tableState.loading}
          menuTableId={tableState.menuTableId}
          onDelete={tableState.requestDelete}
          onEdit={tableState.startEditing}
          onMarkAvailable={(table) => void tableState.markAvailable(table)}
          onToggleMenu={tableState.toggleMenu}
          tables={tableState.filteredTables}
          totalTableCount={tableState.tables.length}
          updatingId={tableState.updatingId}
        />
      </div>

      <TableFormDialog
        editing={tableState.editingId !== null}
        form={tableState.form}
        onChange={tableState.setForm}
        onClose={tableState.closeForm}
        onSubmit={() => void tableState.saveTable()}
        open={tableState.formOpen}
        saving={tableState.saving}
      />

      <ConfirmDialog
        title="Delete table?"
        description={
          tableState.deleteCandidate
            ? `Table ${tableState.deleteCandidate.tableNumber} will be permanently removed. Tables with order history cannot be deleted.`
            : "This table will be permanently removed."
        }
        loading={tableState.deleting}
        onCancel={tableState.closeDeleteDialog}
        onConfirm={() => void tableState.confirmDelete()}
        open={tableState.deleteCandidate !== null}
      />
    </main>
  );
}
