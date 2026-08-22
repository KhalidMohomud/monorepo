import { Router } from "express";

import {
  addItem,
  create,
  getById,
  list,
  removeItem,
  updateItem,
  updateStatus,
} from "../controllers/order.controller.js";
import { Role } from "../generated/prisma/enums.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

export const orderRouter = Router();

orderRouter.use(authenticate);
orderRouter.get(
  "/",
  authorize(Role.ADMIN, Role.WAITER, Role.CASHIER),
  list,
);
orderRouter.get(
  "/:id",
  authorize(Role.ADMIN, Role.WAITER, Role.CASHIER),
  getById,
);
orderRouter.post("/", authorize(Role.ADMIN, Role.WAITER), create);
orderRouter.post(
  "/:id/items",
  authorize(Role.ADMIN, Role.WAITER),
  addItem,
);
orderRouter.patch(
  "/:id/items/:itemId",
  authorize(Role.ADMIN, Role.WAITER),
  updateItem,
);
orderRouter.delete(
  "/:id/items/:itemId",
  authorize(Role.ADMIN, Role.WAITER),
  removeItem,
);
orderRouter.patch(
  "/:id/status",
  authorize(Role.ADMIN, Role.WAITER, Role.CASHIER),
  updateStatus,
);
