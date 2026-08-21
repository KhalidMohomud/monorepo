import { useState, type FormEvent } from "react";

import type { Role } from "@/lib/types";
import { Icon } from "../icon";
import type { UserFormState } from "./user-config";

type UserFormDialogProps = {
  editing: boolean;
  editingSelf: boolean;
  form: UserFormState;
  onChange: (form: UserFormState) => void;
  onClose: () => void;
  onSubmit: () => void;
  open: boolean;
  saving: boolean;
};

// User create and edit share one form; password is optional only during edit.
export function UserFormDialog({
  editing,
  editingSelf,
  form,
  onChange,
  onClose,
  onSubmit,
  open,
  saving,
}: UserFormDialogProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleClose = () => {
    setShowPassword(false);
    onClose();
  };

  if (!open) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        onClick={handleClose}
        aria-label="Close user form"
        className="absolute inset-0 bg-[#211c16]/40 backdrop-blur-[1px]"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-form-title"
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:max-w-xl sm:rounded-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a66d18]">
              Team access
            </p>
            <h2
              id="user-form-title"
              className="mt-2 text-2xl font-bold text-stone-900"
            >
              {editing ? "Edit user" : "Add user"}
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Manage account details and restaurant permissions.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <label className="block text-sm font-bold text-stone-700">
            Full name
            <input
              value={form.name}
              onChange={(event) =>
                onChange({ ...form, name: event.target.value })
              }
              required
              minLength={2}
              maxLength={100}
              autoFocus
              autoComplete="name"
              placeholder="e.g. Amina Hassan"
              className="mt-2 h-12 w-full rounded-xl border border-stone-300 px-4 outline-none transition placeholder:text-stone-400 focus:border-amber-600 focus:ring-3 focus:ring-amber-100"
            />
          </label>

          <label className="block text-sm font-bold text-stone-700">
            Email address
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                onChange({ ...form, email: event.target.value })
              }
              required
              maxLength={254}
              autoComplete="email"
              placeholder="staff@merhaba.test"
              className="mt-2 h-12 w-full rounded-xl border border-stone-300 px-4 outline-none transition placeholder:text-stone-400 focus:border-amber-600 focus:ring-3 focus:ring-amber-100"
            />
          </label>

          <label className="block text-sm font-bold text-stone-700">
            Role
            <select
              value={form.role}
              onChange={(event) =>
                onChange({ ...form, role: event.target.value as Role })
              }
              disabled={editingSelf}
              className="mt-2 h-12 w-full rounded-xl border border-stone-300 bg-white px-4 outline-none transition focus:border-amber-600 focus:ring-3 focus:ring-amber-100 disabled:bg-stone-100 disabled:text-stone-500"
            >
              <option value="STAFF">Staff — daily operations</option>
              <option value="ADMIN">Admin — full management access</option>
            </select>
            {editingSelf ? (
              <span className="mt-1.5 block text-xs font-normal text-amber-700">
                You cannot remove your own administrator role.
              </span>
            ) : null}
          </label>

          <label className="block text-sm font-bold text-stone-700">
            {editing ? "New password" : "Temporary password"}
            {editing ? (
              <span className="font-normal text-stone-400"> (optional)</span>
            ) : null}
            <span className="relative mt-2 block">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) =>
                  onChange({ ...form, password: event.target.value })
                }
                required={!editing}
                minLength={form.password || !editing ? 8 : undefined}
                maxLength={72}
                autoComplete="new-password"
                placeholder={editing ? "Leave blank to keep current password" : "Minimum 8 characters"}
                className="h-12 w-full rounded-xl border border-stone-300 px-4 pr-16 outline-none transition placeholder:text-stone-400 focus:border-amber-600 focus:ring-3 focus:ring-amber-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-bold text-stone-500 hover:bg-stone-100"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </span>
            <span className="mt-1.5 block text-xs font-normal text-stone-400">
              Passwords are sent securely to the API and stored only as hashes.
            </span>
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-stone-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="h-11 rounded-lg border border-stone-300 px-5 text-sm font-bold text-stone-700 hover:bg-stone-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-11 rounded-lg bg-[#eda735] px-6 text-sm font-bold text-white shadow-sm hover:bg-[#d99729] disabled:opacity-60"
            >
              {saving ? "Saving…" : editing ? "Save Changes" : "Add User"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
