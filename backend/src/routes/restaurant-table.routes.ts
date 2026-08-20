import { Router } from "express";

import {
  create,
  getById,
  list,
  remove,
  update,
  updateStatus,
} from "../controllers/restaurant-table.controller.js";
import { Role } from "../generated/prisma/enums.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

export const restaurantTableRouter = Router();

restaurantTableRouter.use(
  authenticate,
  authorize(Role.ADMIN, Role.STAFF),
);

restaurantTableRouter.get("/", list);
restaurantTableRouter.get("/:id", getById);
restaurantTableRouter.post("/", create);
restaurantTableRouter.patch("/:id", update);
restaurantTableRouter.patch("/:id/status", updateStatus);
restaurantTableRouter.delete("/:id", remove);
