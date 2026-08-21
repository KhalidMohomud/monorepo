import { ProtectedPage } from "@/components/protected-page";
import { UserManager } from "@/components/user-manager";

export default function UsersPage() {
  return (
    <ProtectedPage adminOnly>
      <UserManager />
    </ProtectedPage>
  );
}
