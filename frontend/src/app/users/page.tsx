import { ProtectedPage } from "@/components/protected-page";
import { ADMIN_ONLY_ROLES } from "@/lib/permissions";
import { UserManager } from "@/components/user-manager";

export default function UsersPage() {
  return (
    <ProtectedPage allowedRoles={ADMIN_ONLY_ROLES}>
      <UserManager />
    </ProtectedPage>
  );
}
