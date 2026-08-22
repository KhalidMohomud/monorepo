import type { Role } from "@/lib/types";
import type { IconName } from "./icon";

export type NavigationItem = {
  href?: string;
  icon: IconName;
  label: string;
  roles?: readonly Role[];
};

// Items without an href stay visible but disabled until their frontend page exists.
export const primaryNavigation: NavigationItem[] = [
  { href: "/", icon: "grid", label: "Dashboard", roles: ["ADMIN"] },
  { href: "/orders", icon: "receipt", label: "Orders" },
  { href: "/tables", icon: "table", label: "Tables", roles: ["ADMIN"] },
  { href: "/menu-items", icon: "utensils", label: "Menu", roles: ["ADMIN", "WAITER"] },
  {
    href: "/categories",
    icon: "receipt",
    label: "Categories",
    roles: ["ADMIN"],
  },
  { href: "/users", icon: "users", label: "Users", roles: ["ADMIN"] },
];
