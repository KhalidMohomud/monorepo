import { ProtectedPage } from "@/components/protected-page";
import { RestaurantTableManager } from "@/components/restaurant-table-manager";

export default function TablesPage() {
  return (
    <ProtectedPage>
      <RestaurantTableManager />
    </ProtectedPage>
  );
}

