import { MenuItemManager } from "@/components/menu-item-manager";
import { ProtectedPage } from "@/components/protected-page";

export default function MenuItemsPage() {
  return (
    <ProtectedPage>
      <MenuItemManager />
    </ProtectedPage>
  );
}

