import Link from "next/link";

import type { Role } from "@/lib/types";
import { Icon } from "./icon";
import {
  primaryNavigation,
  secondaryNavigation,
  type NavigationItem,
} from "./navigation";

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
  pathname: string;
  role: Role;
};

type SidebarContentProps = Pick<SidebarProps, "onClose" | "pathname" | "role">;

// Shared content keeps desktop and mobile navigation behavior identical.
function SidebarContent({ onClose, pathname, role }: SidebarContentProps) {
  const renderNavigation = (items: NavigationItem[]) =>
    items
      .filter((item) => !item.adminOnly || role === "ADMIN")
      .map((item) => {
        const active = item.href === pathname;
        const className = `flex min-h-11 w-full items-center gap-3.5 rounded-xl px-4 text-[15px] font-bold transition ${
          active
            ? "bg-[linear-gradient(135deg,#f0b44d,#e9a12c)] text-[#5a4018] shadow-[0_6px_14px_rgba(172,112,20,0.18)]"
            : item.href
              ? "text-[#514b43] hover:bg-[#f7f2ea] hover:text-[#251f18]"
              : "cursor-not-allowed text-[#aaa69f]"
        }`;

        return item.href ? (
          <Link
            key={item.label}
            href={item.href}
            onClick={onClose}
            className={className}
          >
            <Icon name={item.icon} className="size-[21px] shrink-0" />
            {item.label}
          </Link>
        ) : (
          <button
            key={item.label}
            type="button"
            disabled
            title={`${item.label} screen is coming next`}
            className={className}
          >
            <Icon name={item.icon} className="size-[21px] shrink-0" />
            {item.label}
          </button>
        );
      });

  return (
    <>
      <div className="flex h-28 items-center gap-4 px-6">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,#f2b84f,#e7a12f)] text-[#684915] shadow-sm">
          <Icon name="shop" className="size-6" />
        </span>
        <div>
          <p className="text-2xl font-extrabold leading-none tracking-tight text-[#624618]">
            Merhaba
          </p>
          <p className="mt-1.5 text-sm font-medium text-[#625c54]">
            Order Desk
          </p>
        </div>
      </div>

      <div className="px-6 pb-7">
        <button
          type="button"
          disabled
          title="Order creation screen is coming next"
          className="flex h-12 w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-xl bg-[linear-gradient(135deg,#f1b64d,#eaa12d)] text-base font-bold text-white opacity-80 shadow-[0_6px_14px_rgba(172,112,20,0.18)]"
        >
          <Icon name="plus" className="size-5" />
          New Order
        </button>
      </div>

      <nav className="flex flex-1 flex-col px-5" aria-label="Main navigation">
        <div className="space-y-2">{renderNavigation(primaryNavigation)}</div>
        <div className="mt-auto space-y-2 border-t border-[#e3d8ca] pb-6 pt-6">
          {renderNavigation(secondaryNavigation)}
        </div>
      </nav>
    </>
  );
}

// Sidebar renders a fixed desktop rail and a matching mobile drawer.
export function Sidebar({ mobileOpen, onClose, pathname, role }: SidebarProps) {
  const contentProps = { onClose, pathname, role };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-[#e0d6ca] bg-[#fffefa] shadow-[4px_0_18px_rgba(67,49,26,0.03)] lg:flex">
        <SidebarContent {...contentProps} />
      </aside>

      {mobileOpen ? (
        <>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/25 lg:hidden"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[288px] flex-col bg-[#fffefa] shadow-2xl lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={onClose}
              className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100"
            >
              <Icon name="close" className="size-5" />
            </button>
            <SidebarContent {...contentProps} />
          </aside>
        </>
      ) : null}
    </>
  );
}
