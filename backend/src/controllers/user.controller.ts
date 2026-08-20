import type { Request, RequestHandler } from "express";

import {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  updateUser,
} from "../services/user.service.js";
import { AppError } from "../utils/app-error.js";
import { idParamSchema } from "../validators/common.validator.js";
import {
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
} from "../validators/user.validator.js";

const getAuthenticatedUserId = (req: Request): string => {
  if (!req.user) {
    throw new AppError(
      401,
      "AUTHENTICATION_REQUIRED",
      "Authentication required",
    );
  }

  return req.user.id;
};

export const list: RequestHandler = async (req, res, next) => {
  try {
    const query = userQuerySchema.parse(req.query);
    const users = await listUsers(query);
    res.status(200).json({ data: { users } });
  } catch (error) {
    next(error);
  }
};

export const getById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const user = await getUserById(id);
    res.status(200).json({ data: { user } });
  } catch (error) {
    next(error);
  }
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    const input = createUserSchema.parse(req.body);
    const user = await createUser(input);
    res.status(201).json({ data: { user } });
  } catch (error) {
    next(error);
  }
};

export const update: RequestHandler = async (req, res, next) => {
  try {
    const authenticatedUserId = getAuthenticatedUserId(req);
    const { id } = idParamSchema.parse(req.params);
    const input = updateUserSchema.parse(req.body);
    const user = await updateUser(id, input, authenticatedUserId);
    res.status(200).json({ data: { user } });
  } catch (error) {
    next(error);
  }
};

export const remove: RequestHandler = async (req, res, next) => {
  try {
    const authenticatedUserId = getAuthenticatedUserId(req);
    const { id } = idParamSchema.parse(req.params);
    await deleteUser(id, authenticatedUserId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
