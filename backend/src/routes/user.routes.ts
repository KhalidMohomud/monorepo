import { Router } from "express";

import {
  create,
  getById,
  list,
  remove,
  update,
} from "../controllers/user.controller.js";
import { Role } from "../generated/prisma/enums.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

export const userRouter = Router();

userRouter.use(authenticate, authorize(Role.ADMIN));
userRouter.get("/", list);
userRouter.get("/:id", getById);
userRouter.post("/", create);
userRouter.patch("/:id", update);
userRouter.delete("/:id", remove);
