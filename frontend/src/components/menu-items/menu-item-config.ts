export type MenuItemFormState = {
  categoryId: string;
  description: string;
  imageUrl: string;
  isAvailable: boolean;
  name: string;
  price: string;
};

export const EMPTY_MENU_ITEM_FORM: MenuItemFormState = {
  categoryId: "",
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  isAvailable: true,
};
