import type { RequestHandler } from "express";

import {
  addOrderItem,
  createOrder,
  deleteOrderItem,
  getOrderById,
  listOrders,
  updateOrderItem,
  updateOrderStatus,
} from "../services/order.service.js";
import { AppError } from "../utils/app-error.js";
import { idParamSchema } from "../validators/common.validator.js";
import {
  addOrderItemSchema,
  createOrderSchema,
  orderItemParamSchema,
  orderQuerySchema,
  updateOrderItemSchema,
  updateOrderStatusSchema,
} from "../validators/order.validator.js";

const authenticatedUser = (
  user: Express.Request["user"],
): NonNullable<Express.Request["user"]> => {
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
    const user = authenticatedUser(req.user);
    const query = orderQuerySchema.parse(req.query);
    const orders = await listOrders(query, user.role);
    res.status(200).json({ data: { orders } });
  } catch (error) {
    next(error);
  }
};

export const getById: RequestHandler = async (req, res, next) => {
  try {
    const user = authenticatedUser(req.user);
    const { id } = idParamSchema.parse(req.params);
    const order = await getOrderById(id, user.role);
    res.status(200).json({ data: { order } });
  } catch (error) {
    next(error);
  }
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    const user = authenticatedUser(req.user);
    const input = createOrderSchema.parse(req.body);
    const order = await createOrder(input, user.id);
    res.status(201).json({ data: { order } });
  } catch (error) {
    next(error);
  }
};

export const addItem: RequestHandler = async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const input = addOrderItemSchema.parse(req.body);
    const order = await addOrderItem(id, input);
    res.status(201).json({ data: { order } });
  } catch (error) {
    next(error);
  }
};

export const updateItem: RequestHandler = async (req, res, next) => {
  try {
    const { id, itemId } = orderItemParamSchema.parse(req.params);
    const input = updateOrderItemSchema.parse(req.body);
    const order = await updateOrderItem(id, itemId, input);
    res.status(200).json({ data: { order } });
  } catch (error) {
    next(error);
  }
};

export const removeItem: RequestHandler = async (req, res, next) => {
  try {
    const { id, itemId } = orderItemParamSchema.parse(req.params);
    const order = await deleteOrderItem(id, itemId);
    res.status(200).json({ data: { order } });
  } catch (error) {
    next(error);
  }
};

export const updateStatus: RequestHandler = async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const user = authenticatedUser(req.user);
    const input = updateOrderStatusSchema.parse(req.body);
    const order = await updateOrderStatus(id, input, user.role);
    res.status(200).json({ data: { order } });
  } catch (error) {
    next(error);
  }
};
