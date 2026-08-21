import { CreateOrderManager } from "@/components/create-order-manager";
import { ProtectedPage } from "@/components/protected-page";

export default function CreateOrderPage() {
  return (
    <ProtectedPage>
      <CreateOrderManager />
    </ProtectedPage>
  );
}
