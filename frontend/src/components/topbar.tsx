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


    </header>
  );
}
