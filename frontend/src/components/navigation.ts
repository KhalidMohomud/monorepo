import type { IconName } from "./icon";

export type NavigationItem = {
  adminOnly?: boolean;
  href?: string;
  icon: IconName;
  label: string;
};

// Items without an href stay visible but disabled until their frontend page exists.
export const primaryNavigation: NavigationItem[] = [
  { href: "/", icon: "grid", label: "Dashboard", adminOnly: true, },
  { href: "/orders", icon: "receipt", label: "Orders" },
  { href: "/tables", icon: "table", label: "Tables", },
  { href: "/menu-items", icon: "utensils", label: "Menu" },
  {
    href: "/categories",
    icon: "receipt",
    label: "Categories",
    adminOnly: true,
  },
  { href: "/users", icon: "users", label: "Users", adminOnly: true },
  // { icon: "chart", label: "Reports", adminOnly: true },
];
