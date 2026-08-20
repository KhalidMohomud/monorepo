import { CategoryManager } from "@/components/category-manager";
import { ProtectedPage } from "@/components/protected-page";

export default function CategoriesPage() {
  return (
    <ProtectedPage adminOnly>
      <CategoryManager />
    </ProtectedPage>
  );
}

