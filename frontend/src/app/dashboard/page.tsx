import { DashboardManager } from "@/components/dashboard-manager";
import { ProtectedPage } from "@/components/protected-page";
import { ADMIN_ONLY_ROLES } from "@/lib/permissions";

export default function DashboardPage() {
  return (
    <ProtectedPage allowedRoles={ADMIN_ONLY_ROLES}>
      <DashboardManager />
    </ProtectedPage>
  );
}
