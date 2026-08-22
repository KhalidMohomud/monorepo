import { CreateOrderManager } from "@/components/create-order-manager";
import { ProtectedPage } from "@/components/protected-page";
import { ORDER_ENTRY_ROLES } from "@/lib/permissions";

export default function CreateOrderPage() {
  return (
    <ProtectedPage allowedRoles={ORDER_ENTRY_ROLES}>
      <CreateOrderManager />
    </ProtectedPage>
  );
}
