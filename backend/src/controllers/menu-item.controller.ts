import type { RequestHandler } from "express";

import {
  createMenuItem,
  deleteMenuItem,
  getMenuItemById,
  listMenuItems,
  updateMenuItem,
} from "../services/menu-item.service.js";
import { AppError } from "../utils/app-error.js";
import { idParamSchema } from "../validators/common.validator.js";
import {
  createMenuItemSchema,
  menuItemQuerySchema,
  updateMenuItemSchema,
} from "../validators/menu-item.validator.js";
const requireUser = (user: Express.Request["user"]) => {
  if (!user) {
    throw new AppError(
      401,
      "AUTHENTICATION_REQUIRED",
      "Authentication required",
    );
  }

  return user;
};

export const list: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req.user);
    const query = menuItemQuerySchema.parse(req.query);
    const menuItems = await listMenuItems(query, user.role);
    res.status(200).json({ data: { menuItems } });
  } catch (error) {
    next(error);
  }
};

export const getById: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req.user);
    const { id } = idParamSchema.parse(req.params);
    const menuItem = await getMenuItemById(id, user.role);
    res.status(200).json({ data: { menuItem } });
  } catch (error) {
    next(error);
  }
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    const input = createMenuItemSchema.parse(req.body);
    const menuItem = await createMenuItem(input);
    res.status(201).json({ data: { menuItem } });
  } catch (error) {
    next(error);
  }
};

export const update: RequestHandler = async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const input = updateMenuItemSchema.parse(req.body);
    const menuItem = await updateMenuItem(id, input);
    res.status(200).json({ data: { menuItem } });
  } catch (error) {
    next(error);
  }
};

export const remove: RequestHandler = async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    await deleteMenuItem(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
