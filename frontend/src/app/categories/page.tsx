import { CategoryManager } from "@/components/category-manager";
import { ProtectedPage } from "@/components/protected-page";
import { ADMIN_ONLY_ROLES } from "@/lib/permissions";

export default function CategoriesPage() {
  return (
    <ProtectedPage allowedRoles={ADMIN_ONLY_ROLES}>
      <CategoryManager />
    </ProtectedPage>
  );
}
