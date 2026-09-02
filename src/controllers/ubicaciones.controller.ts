import type { Request, Response } from "express";
import {
  createUbicacion,
  deleteUbicacion,
  getUbicacionById,
  listUbicaciones,
  updateUbicacion,
} from "../services/ubicaciones.service";
import {
  createUbicacionSchema,
  updateUbicacionSchema,
  ubicacionIdSchema,
} from "../schemas";
import {
  sendServiceResult,
  sendValidationError,
} from "../helper/controller.helper";

export const getUbicaciones = async (req: Request, res: Response) => {
  const result = await listUbicaciones(req.supabaseUser!, req.user!.id);
  return sendServiceResult(res, result);
};

export const getUbicacion = async (req: Request, res: Response) => {
  const params = ubicacionIdSchema.safeParse(req.params);
  if (!params.success) {
    return sendValidationError(res, params.error);
  }

  const result = await getUbicacionById(
    req.supabaseUser!,
    req.user!.id,
    String(params.data.id),
  );
  return sendServiceResult(res, result);
};

export const postUbicacion = async (req: Request, res: Response) => {
  const parsed = createUbicacionSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  const result = await createUbicacion(
    req.supabaseUser!,
    req.user!.id,
    parsed.data,
  );

  return sendServiceResult(res, result);
};

export const putUbicacion = async (req: Request, res: Response) => {
  const params = ubicacionIdSchema.safeParse(req.params);
  if (!params.success) {
    return sendValidationError(res, params.error);
  }

  const parsed = updateUbicacionSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  const result = await updateUbicacion(
    req.supabaseUser!,
    req.user!.id,
    String(params.data.id),
    parsed.data,
  );

  return sendServiceResult(res, result);
};

export const removeUbicacion = async (req: Request, res: Response) => {
  const params = ubicacionIdSchema.safeParse(req.params);
  if (!params.success) {
    return sendValidationError(res, params.error);
  }

  const result = await deleteUbicacion(
    req.supabaseUser!,
    req.user!.id,
    String(params.data.id),
  );

  return sendServiceResult(res, result);
};
