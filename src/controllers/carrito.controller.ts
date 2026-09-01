import type { Request, Response } from "express";
import {
  addToCarrito as addToCarritoService,
  clearCarrito as clearCarritoService,
  getCarrito as getCarritoService,
  removeFromCarrito as removeFromCarritoService,
  updateCarritoItem as updateCarritoItemService,
} from "../services/carrito.service";

import {
  addCarritoSchema,
  articuloIdSchema,
  updateCarritoItemSchema,
} from "../schemas";
import {
  sendServiceResult,
  sendValidationError,
} from "../helper/controller.helper";

export const getCarrito = async (req: Request, res: Response) => {
  const result = await getCarritoService(req.supabaseUser!, req.user!.id);
  return sendServiceResult(res, result);
};

export const addToCarrito = async (req: Request, res: Response) => {
  const parsed = addCarritoSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  const result = await addToCarritoService(
    req.supabaseUser!,
    req.user!.id,
    parsed.data.producto_id,
    parsed.data.cantidad,
  );

  return sendServiceResult(res, result);
};

export const updateCarritoItem = async (req: Request, res: Response) => {
  const params = articuloIdSchema.safeParse(req.params);
  if (!params.success) {
    return sendValidationError(res, params.error);
  }

  const parsed = updateCarritoItemSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  const result = await updateCarritoItemService(
    req.supabaseUser!,
    req.user!.id,
    String(params.data.articuloId),
    parsed.data.cantidad,
  );

  return sendServiceResult(res, result);
};

export const removeFromCarrito = async (req: Request, res: Response) => {
  const params = articuloIdSchema.safeParse(req.params);
  if (!params.success) {
    return sendValidationError(res, params.error);
  }

  const result = await removeFromCarritoService(
    req.supabaseUser!,
    req.user!.id,
    String(params.data.articuloId),
  );

  return sendServiceResult(res, result);
};

export const clearCarrito = async (req: Request, res: Response) => {
  const result = await clearCarritoService(req.supabaseUser!, req.user!.id);
  return sendServiceResult(res, result);
};
