import { Router } from "express";

import {
  create,
  getById,
  list,
  remove,
  update,
} from "../controllers/menu-item.controller.js";
import { upload } from "../controllers/menu-image.controller.js";
import { Role } from "../generated/prisma/enums.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { uploadMenuItemImage } from "../middleware/image-upload.middleware.js";

export const menuItemRouter = Router();

menuItemRouter.use(authenticate);
menuItemRouter.get("/", authorize(Role.ADMIN, Role.STAFF), list);
menuItemRouter.post(
  "/images",
  authorize(Role.ADMIN),
  uploadMenuItemImage,
  upload,
);
menuItemRouter.get("/:id", authorize(Role.ADMIN, Role.STAFF), getById);
menuItemRouter.post("/", authorize(Role.ADMIN), create);
menuItemRouter.patch("/:id", authorize(Role.ADMIN), update);
menuItemRouter.delete("/:id", authorize(Role.ADMIN), remove);
