import type { UserAccount } from "@/lib/types";
import { Icon } from "../icon";
import {
  USER_ROLE_LABELS,
  USER_ROLE_STYLES,
  type UserFilter,
} from "./user-config";

type UserTableProps = {
  currentUserId: string;
  filter: UserFilter;
  loading: boolean;
  onAdd: () => void;
  onDelete: (user: UserAccount) => void;
  onEdit: (user: UserAccount) => void;
  onFilterChange: (filter: UserFilter) => void;
  onQueryChange: (query: string) => void;
  query: string;
  totalUserCount: number;
  users: UserAccount[];
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function LoadingRows() {
  return Array.from({ length: 4 }, (_, index) => (
    <tr key={index} className="border-t border-stone-200">
      <td className="px-5 py-5" colSpan={5}>
        <div className="h-5 animate-pulse rounded bg-stone-100" />
      </td>
    </tr>
  ));
}

// UserTable keeps team membership and permissions easy to scan.
export function UserTable({
  currentUserId,
  filter,
  loading,
  onAdd,
  onDelete,
  onEdit,
  onFilterChange,
  onQueryChange,
  query,
  totalUserCount,
  users,
}: UserTableProps) {
  if (!loading && totalUserCount === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-[#d8cec2] bg-white px-6 py-16 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
          <Icon name="users" className="size-6" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-stone-900">No users yet</h2>
        <p className="mt-1 text-sm text-stone-500">
          Add a waiter, cashier, or administrator account to build your team.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#eda735] px-5 text-sm font-bold text-white hover:bg-[#d99729]"
        >
          <Icon name="plus" className="size-4" />
          Add User
        </button>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e1d9cf] bg-white shadow-[0_5px_18px_rgba(62,46,27,0.05)]">
      <div className="flex flex-col gap-4 border-b border-[#e7e0d7] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-bold text-stone-900">Team members</h2>
          <p className="mt-0.5 text-xs text-stone-500">
            {totalUserCount} {totalUserCount === 1 ? "account" : "accounts"}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label>
            <span className="sr-only">Filter users by role</span>
            <select
              value={filter}
              onChange={(event) =>
                onFilterChange(event.target.value as UserFilter)
              }
              className="h-10 w-full rounded-lg border border-stone-300 bg-[#fcfbf9] px-3 text-sm font-semibold text-stone-700 outline-none focus:border-amber-600 focus:ring-3 focus:ring-amber-100 sm:w-40"
            >
              <option value="ALL">All roles</option>
              <option value="ADMIN">Admins</option>
              <option value="WAITER">Waiters</option>
              <option value="CASHIER">Cashiers</option>
            </select>
          </label>
          <label className="relative block w-full sm:w-72">
            <span className="sr-only">Search users</span>
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search name or email..."
              className="h-10 w-full rounded-lg border border-stone-300 bg-[#fcfbf9] pl-9 pr-3 text-sm outline-none focus:border-amber-600 focus:ring-3 focus:ring-amber-100"
            />
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] border-collapse text-left">
          <thead className="bg-[#faf8f5] text-xs font-bold uppercase tracking-wider text-stone-500">
            <tr>
              <th className="px-5 py-3.5">User</th>
              <th className="px-5 py-3.5">Role</th>
              <th className="px-5 py-3.5">Created</th>
              <th className="px-5 py-3.5">Updated</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRows />
            ) : users.length === 0 ? (
              <tr className="border-t border-stone-200">
                <td colSpan={5} className="px-5 py-12 text-center">
                  <p className="font-bold text-stone-800">No matching users</p>
                  <button
                    type="button"
                    onClick={() => {
                      onQueryChange("");
                      onFilterChange("ALL");
                    }}
                    className="mt-2 text-sm font-bold text-amber-700 hover:text-amber-900"
                  >
                    Clear filters
                  </button>
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isCurrentUser = user.id === currentUserId;

                return (
                  <tr
                    key={user.id}
                    className="border-t border-stone-200 transition hover:bg-[#fffcf7]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,#f3c66f,#dda039)] text-sm font-bold text-white">
                          {user.name
                            .split(" ")
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join("")
                            .toUpperCase()}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-stone-900">{user.name}</p>
                            {isCurrentUser ? (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                                You
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 text-xs text-stone-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${USER_ROLE_STYLES[user.role]}`}
                      >
                        {USER_ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-500">
                      {dateFormatter.format(new Date(user.createdAt))}
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-500">
                      {dateFormatter.format(new Date(user.updatedAt))}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(user)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-stone-300 px-3 text-xs font-bold text-stone-700 hover:bg-stone-50"
                        >
                          <Icon name="pencil" className="size-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(user)}
                          disabled={isCurrentUser}
                          title={
                            isCurrentUser
                              ? "You cannot delete your own account"
                              : `Delete ${user.name}`
                          }
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-400 disabled:hover:bg-white"
                        >
                          <Icon name="trash" className="size-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
