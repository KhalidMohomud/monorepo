import { Icon } from "./icon";

type ConfirmDialogProps = {
  confirmLabel?: string;
  description: string;
  loading?: boolean;
  loadingLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
};

// Reusable confirmation avoids inconsistent browser-native confirm dialogs.
export function ConfirmDialog({
  confirmLabel = "Delete",
  description,
  loading = false,
  loadingLabel = "Deleting…",
  onCancel,
  onConfirm,
  open,
  title,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        onClick={onCancel}
        aria-label="Close confirmation"
        className="absolute inset-0 bg-[#211c16]/40 backdrop-blur-[1px]"
      />
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        className="relative w-full rounded-t-2xl bg-white p-6 shadow-2xl sm:max-w-md sm:rounded-2xl"
      >
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-700">
            <Icon name="trash" className="size-5" />
          </span>
          <div>
            <h2 id="confirm-title" className="text-lg font-bold text-stone-900">
              {title}
            </h2>
            <p
              id="confirm-description"
              className="mt-2 text-sm leading-6 text-stone-600"
            >
              {description}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-11 rounded-lg border border-stone-300 px-5 text-sm font-bold text-stone-700 hover:bg-stone-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="h-11 rounded-lg bg-red-600 px-5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
