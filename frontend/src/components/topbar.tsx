import Link from "next/link";

import type { AuthUser } from "@/lib/types";
import { Icon } from "./icon";

type TopbarProps = {
  onLogout: () => void;
  onMenuOpen: () => void;
  user: AuthUser;
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "M";

// Topbar contains session actions; page-specific actions stay inside each page.
export function Topbar({ onLogout, onMenuOpen, user }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-[#e0d6ca] bg-[#fbf9f6]/95 px-4 backdrop-blur sm:px-6 lg:px-7">
      <button
        type="button"
        aria-label="Open navigation"
        onClick={onMenuOpen}
        className="mr-3 flex size-9 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 lg:hidden"
      >
        <Icon name="menu" className="size-6" />
      </button>

      <Link
        href="/"
        className="text-lg font-bold tracking-tight text-[#694817] sm:text-xl"
      >
        Merhaba Order Desk
      </Link>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
        <nav className="mr-2 hidden items-center gap-6 text-xs font-bold text-[#554d43] xl:flex">
          <span>POS</span>
          <span>Kitchen</span>
          <span>Deliveries</span>
        </nav>
        <button
          type="button"
          disabled
          aria-label="Notifications"
          className="hidden size-9 cursor-not-allowed items-center justify-center rounded-lg text-[#554d43] opacity-70 sm:flex"
        >
          <Icon name="bell" className="size-5" />
        </button>
        <button
          type="button"
          disabled
          aria-label="Activity history"
          className="hidden size-9 cursor-not-allowed items-center justify-center rounded-lg text-[#554d43] opacity-70 sm:flex"
        >
          <Icon name="history" className="size-5" />
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-lg bg-[#eda735] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#d99729] sm:px-5"
        >
          Check Out
        </button>
        <div
          className="flex size-9 items-center justify-center rounded-full border-2 border-white bg-[#765a32] text-xs font-bold text-white shadow"
          title={`${user.name} · ${user.role}`}
          aria-label={`${user.name}, ${user.role}`}
        >
          {getInitials(user.name)}
        </div>
      </div>
    </header>
  );
}
