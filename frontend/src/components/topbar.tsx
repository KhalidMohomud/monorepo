import Link from "next/link";

import { landingPageForRole } from "@/lib/permissions";
import type { Role } from "@/lib/types";
import { Icon } from "./icon";

type TopbarProps = {
  onMenuOpen: () => void;
  role: Role;
};

// Topbar keeps mobile navigation available while page actions stay in context.
export function Topbar({ onMenuOpen, role }: TopbarProps) {
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
        href={landingPageForRole(role)}
        className="text-lg font-bold tracking-tight text-[#694817] sm:text-xl"
      >
        Merhaba Order Desk
      </Link>
    </header>
  );
}
