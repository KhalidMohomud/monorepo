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

orderRouter.use(authenticate, authorize(Role.ADMIN, Role.STAFF));
orderRouter.get("/", list);
orderRouter.get("/:id", getById);
orderRouter.post("/", create);
orderRouter.post("/:id/items", addItem);
orderRouter.patch("/:id/items/:itemId", updateItem);
orderRouter.delete("/:id/items/:itemId", removeItem);
orderRouter.patch("/:id/status", updateStatus);
