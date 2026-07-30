import type { Request, Response } from "express";
import {
    createUbicacion,
    deleteUbicacion,
    getUbicacionById,
    listUbicaciones,
    updateUbicacion,
    type ServiceResult,
} from "../services/ubicaciones.service.js";

function sendServiceResult<T>(res: Response, result: ServiceResult<T>) {
    if (!result.success) {
        return res.status(result.status).json({ error: result.error });
    }
    return res.status(result.status).json(result.data);
}

export const getUbicaciones = async (req: Request, res: Response) => {
      const result = await listUbicaciones(req.supabaseUser!, req.user!.id);
      return sendServiceResult(res, result);
};

export const getUbicacion = async (req: Request, res: Response) => {
    const result = await getUbicacionById(
        req.supabaseUser!,
        req.user!.id,
        req.params.id as string
    );
    return sendServiceResult(res, result);
};

export const postUbicacion = async (req: Request, res: Response) => {
      const result = await createUbicacion(
        req.supabaseUser!,
        req.user!.id,
        (req.body ?? {}) as Record<string, unknown>
      );

    return sendServiceResult(res, result);
};

export const putUbicacion = async (req: Request, res: Response) => {
  const result = await updateUbicacion(
        req.supabaseUser!,
        req.user!.id,
        req.params.id as string,
        (req.body ?? {}) as Record<string, unknown>
    );

      return sendServiceResult(res, result);
};

export const removeUbicacion = async (req: Request, res: Response) => {
    const result = await deleteUbicacion(
        req.supabaseUser!,
        req.user!.id,
        req.params.id as string
    );

    return sendServiceResult(res, result);
};
