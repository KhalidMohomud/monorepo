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

const authenticatedUserId = (user: Express.Request["user"]): string => {
  if (!user) {
    throw new AppError(
      401,
      "AUTHENTICATION_REQUIRED",
      "Authentication required",
    );
  }

  return user.id;
};

export const list: RequestHandler = async (req, res, next) => {
  try {
    const query = orderQuerySchema.parse(req.query);
    const orders = await listOrders(query);
    res.status(200).json({ data: { orders } });
  } catch (error) {
    next(error);
  }
};

export const getById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const order = await getOrderById(id);
    res.status(200).json({ data: { order } });
  } catch (error) {
    next(error);
  }
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    const userId = authenticatedUserId(req.user);
    const input = createOrderSchema.parse(req.body);
    const order = await createOrder(input, userId);
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
    const input = updateOrderStatusSchema.parse(req.body);
    const order = await updateOrderStatus(id, input);
    res.status(200).json({ data: { order } });
  } catch (error) {
    next(error);
  }
};
