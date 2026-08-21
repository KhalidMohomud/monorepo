import Link from "next/link";

import { Icon, type IconName } from "@/components/icon";

const actions: Array<{
  description: string;
  href: string;
  icon: IconName;
  label: string;
}> = [
  {
    href: "/orders/new",
    icon: "plus",
    label: "New Order",
    description: "Start a new order",
  },
  {
    href: "/tables",
    icon: "grid",
    label: "View Tables",
    description: "Check floor status",
  },
  {
    href: "/menu-items",
    icon: "utensils",
    label: "Manage Menu",
    description: "Items and availability",
  },
];

export function DashboardQuickActions() {
  return (
    <aside className="rounded-xl border border-[#e1d9cf] bg-white p-5 shadow-[0_5px_18px_rgba(62,46,27,0.05)]">
      <h2 className="text-2xl font-extrabold text-stone-900">Quick Actions</h2>
      <div className="mt-4 space-y-3">
        {actions.map((action, index) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex min-h-20 items-center gap-4 rounded-xl border border-[#d9cbbb] bg-[#fff9f2] p-4 transition hover:border-[#d6a050] hover:bg-[#fff5e8]"
          >
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                index === 0
                  ? "bg-[#eda735] text-white"
                  : "bg-[#f1ece6] text-stone-700"
              }`}
            >
              <Icon name={action.icon} className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-lg text-stone-900">
                {action.label}
              </strong>
              <span className="block text-xs text-stone-600">
                {action.description}
              </span>
            </span>
            <Icon name="chevron-right" className="size-5 text-stone-500" />
          </Link>
        ))}
      </div>
    </aside>
  );
}
