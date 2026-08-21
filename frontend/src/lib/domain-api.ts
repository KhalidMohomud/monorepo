import { apiRequest } from "./api";
import type {
  Category,
  MenuItem,
  Order,
  OrderStatus,
  RestaurantTable,
  Role,
  TableStatus,
  UserAccount,
} from "./types";

type CategoryInput = {
  name: string;
  description: string | null;
};

type MenuItemInput = {
  categoryId: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  isAvailable: boolean;
};

type RestaurantTableInput = {
  tableNumber: number;
  capacity: number;
  status?: TableStatus;
};

type CreateUserInput = {
  email: string;
  name: string;
  password: string;
  role: Role;
};

type UpdateUserInput = Partial<CreateUserInput>;

type OrderLineInput = {
  menuItemId: string;
  quantity: number;
};

export const categoryApi = {
  list: (token: string) =>
    apiRequest<{ data: { categories: Category[] } }>("/V1/categories", {
      token,
    }),
  create: (token: string, input: CategoryInput) =>
    apiRequest<{ data: { category: Category } }>("/V1/categories", {
      method: "POST",
      token,
      body: input,
    }),
  update: (token: string, id: string, input: CategoryInput) =>
    apiRequest<{ data: { category: Category } }>(`/V1/categories/${id}`, {
      method: "PATCH",
      token,
      body: input,
    }),
  remove: (token: string, id: string) =>
    apiRequest<void>(`/V1/categories/${id}`, {
      method: "DELETE",
      token,
    }),
};

export const menuItemApi = {
  list: (token: string) =>
    apiRequest<{ data: { menuItems: MenuItem[] } }>("/V1/menu-items", {
      token,
    }),
  create: (token: string, input: MenuItemInput) =>
    apiRequest<{ data: { menuItem: MenuItem } }>("/V1/menu-items", {
      method: "POST",
      token,
      body: input,
    }),
  update: (token: string, id: string, input: Partial<MenuItemInput>) =>
    apiRequest<{ data: { menuItem: MenuItem } }>(`/V1/menu-items/${id}`, {
      method: "PATCH",
      token,
      body: input,
    }),
  remove: (token: string, id: string) =>
    apiRequest<void>(`/V1/menu-items/${id}`, {
      method: "DELETE",
      token,
    }),
};

export const restaurantTableApi = {
  list: (token: string) =>
    apiRequest<{ data: { tables: RestaurantTable[] } }>("/V1/tables", {
      token,
    }),
  create: (token: string, input: RestaurantTableInput) =>
    apiRequest<{ data: { table: RestaurantTable } }>("/V1/tables", {
      method: "POST",
      token,
      body: input,
    }),
  update: (token: string, id: string, input: RestaurantTableInput) =>
    apiRequest<{ data: { table: RestaurantTable } }>(`/V1/tables/${id}`, {
      method: "PATCH",
      token,
      body: input,
    }),
  updateStatus: (token: string, id: string, status: TableStatus) =>
    apiRequest<{ data: { table: RestaurantTable } }>(
      `/V1/tables/${id}/status`,
      {
        method: "PATCH",
        token,
        body: { status },
      },
    ),
  remove: (token: string, id: string) =>
    apiRequest<void>(`/V1/tables/${id}`, {
      method: "DELETE",
      token,
    }),
};

export const userApi = {
  list: (token: string) =>
    apiRequest<{ data: { users: UserAccount[] } }>("/V1/users", { token }),
  create: (token: string, input: CreateUserInput) =>
    apiRequest<{ data: { user: UserAccount } }>("/V1/users", {
      method: "POST",
      token,
      body: input,
    }),
  update: (token: string, id: string, input: UpdateUserInput) =>
    apiRequest<{ data: { user: UserAccount } }>(`/V1/users/${id}`, {
      method: "PATCH",
      token,
      body: input,
    }),
  remove: (token: string, id: string) =>
    apiRequest<void>(`/V1/users/${id}`, {
      method: "DELETE",
      token,
    }),
};

export const orderApi = {
  list: (token: string, active: boolean) =>
    apiRequest<{ data: { orders: Order[] } }>(
      `/V1/orders?active=${String(active)}`,
      { token },
    ),
  create: (token: string, tableId: string, items: OrderLineInput[]) =>
    apiRequest<{ data: { order: Order } }>("/V1/orders", {
      method: "POST",
      token,
      body: { tableId, items },
    }),
  addItem: (token: string, orderId: string, item: OrderLineInput) =>
    apiRequest<{ data: { order: Order } }>(`/V1/orders/${orderId}/items`, {
      method: "POST",
      token,
      body: item,
    }),
  updateItem: (
    token: string,
    orderId: string,
    itemId: string,
    quantity: number,
  ) =>
    apiRequest<{ data: { order: Order } }>(
      `/V1/orders/${orderId}/items/${itemId}`,
      { method: "PATCH", token, body: { quantity } },
    ),
  removeItem: (token: string, orderId: string, itemId: string) =>
    apiRequest<{ data: { order: Order } }>(
      `/V1/orders/${orderId}/items/${itemId}`,
      { method: "DELETE", token },
    ),
  updateStatus: (token: string, orderId: string, status: OrderStatus) =>
    apiRequest<{ data: { order: Order } }>(`/V1/orders/${orderId}/status`, {
      method: "PATCH",
      token,
      body: { status },
    }),
};
