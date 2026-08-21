import { OrderManager } from "@/components/order-manager";
import { ProtectedPage } from "@/components/protected-page";

export default function OrdersPage() {
  return (
    <ProtectedPage>
      <OrderManager />
    </ProtectedPage>
  );
}
