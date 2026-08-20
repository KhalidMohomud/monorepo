import { Router } from "express";

import {
  create,
  getById,
  list,
  remove,
  update,
} from "../controllers/category.controller.js";
import { Role } from "../generated/prisma/enums.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

export const categoryRouter = Router();

categoryRouter.use(authenticate, authorize(Role.ADMIN));
categoryRouter.get("/", list);
categoryRouter.get("/:id", getById);
categoryRouter.post("/", create);
categoryRouter.patch("/:id", update);
categoryRouter.delete("/:id", remove);
