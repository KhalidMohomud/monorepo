"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { Icon } from "./icon";

type ToastTone = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  title: string;
  tone: ToastTone;
};

type ToastInput = Omit<Toast, "id">;

type ToastContextValue = {
  error: (message: string | null, title?: string) => void;
  info: (message: string, title?: string) => void;
  success: (message: string, title?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);
let nextToastId = 0;

const toneStyles: Record<ToastTone, string> = {
  success: "border-emerald-200 bg-white text-emerald-700",
  error: "border-red-200 bg-white text-red-700",
  info: "border-amber-200 bg-white text-amber-700",
};

// ToastProvider gives mutation screens one consistent, non-blocking alert system.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (input: ToastInput) => {
      nextToastId += 1;
      const id = nextToastId;
      setToasts((current) => [...current, { ...input, id }].slice(-4));
      window.setTimeout(() => dismiss(id), 4_500);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (message, title = "Success") =>
        show({ message, title, tone: "success" }),
      error: (message, title = "Action failed") => {
        if (message) {
          show({ message, title, tone: "error" });
        }
      },
      info: (message, title = "Notice") =>
        show({ message, title, tone: "info" }),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-[0_16px_45px_rgba(61,45,25,0.16)] ${toneStyles[toast.tone]}`}
          >
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-current/10">
              {toast.tone === "success" ? (
                <Icon name="check" className="size-4" />
              ) : toast.tone === "error" ? (
                <span className="text-lg font-bold leading-none">!</span>
              ) : (
                <span className="text-sm font-bold leading-none">i</span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-stone-900">{toast.title}</p>
              <p className="mt-1 text-sm leading-5 text-stone-600">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            >
              <Icon name="close" className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}
