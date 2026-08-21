import { DashboardManager } from "@/components/dashboard-manager";
import { ProtectedPage } from "@/components/protected-page";

export default function Home() {
  return (
    <ProtectedPage>
      <DashboardManager />
    </ProtectedPage>
  );
}
