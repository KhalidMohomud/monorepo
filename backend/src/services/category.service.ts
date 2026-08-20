import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../validators/category.validator.js";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/app-error.js";
import { isPrismaError } from "../utils/prisma-error.js";

const categoryNotFound = () =>
  new AppError(404, "CATEGORY_NOT_FOUND", "Category not found");

const categoryNameInUse = () =>
  new AppError(
    409,
    "CATEGORY_NAME_IN_USE",
    "A category with this name already exists",
  );

const toCategoryResponse = <
  T extends { _count: { menuItems: number } },
>(category: T) => {
  const { _count, ...categoryData } = category;

  return { ...categoryData, menuItemCount: _count.menuItems };
};

const categoryInclude = {
  _count: { select: { menuItems: true } },
} as const;
// list all categories in the database, ordered by name. Each category will include the number of menu items it contains.
export const listCategories = async () => {
  const categories = await prisma.category.findMany({
    include: categoryInclude,
    orderBy: { name: "asc" },
  });

  return categories.map(toCategoryResponse);
};
// get a category by its id. If the category does not exist, it will throw an error.
export const getCategoryById = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: categoryInclude,
  });

  if (!category) {
    throw categoryNotFound();
  }

  return toCategoryResponse(category);
};
// create a new category in the database. If the category name is already in use, it will throw an error.
export const createCategory = async (input: CreateCategoryInput) => {
  try {
    const category = await prisma.category.create({
      data: input,
      include: categoryInclude,
    });

    return toCategoryResponse(category);
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw categoryNameInUse();
    }

    throw error;
  }
};
// update a category in the database. If the category name is already in use, it will throw an error. If the category does not exist, it will throw an error.
export const updateCategory = async (
  id: string,
  input: UpdateCategoryInput,
) => {
  try {
    const category = await prisma.category.update({
      where: { id },
      data: input,
      include: categoryInclude,
    });

    return toCategoryResponse(category);
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw categoryNameInUse();
    }

    if (isPrismaError(error, "P2025")) {
      throw categoryNotFound();
    }

    throw error;
  }
};
// delete a category from the database. If the category does not exist, it will throw an error. If the category contains menu items, it will throw an error.
export const deleteCategory = async (id: string): Promise<void> => {
  try {
    await prisma.category.delete({ where: { id } });
  } catch (error) {
    if (isPrismaError(error, "P2003")) {
      throw new AppError(
        409,
        "CATEGORY_IN_USE",
        "Category cannot be deleted while it contains menu items",
      );
    }

    if (isPrismaError(error, "P2025")) {
      throw categoryNotFound();
    }

    throw error;
  }
};
