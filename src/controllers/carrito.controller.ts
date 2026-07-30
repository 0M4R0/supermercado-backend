import type { Request, Response } from "express";
import {
    addToCarrito as addToCarritoService,
    clearCarrito as clearCarritoService,
    getCarrito as getCarritoService,
    removeFromCarrito as removeFromCarritoService,
    updateCarritoItem as updateCarritoItemService,
    type ServiceResult,
} from "../services/carrito.service.js";

function sendServiceResult<T>(res: Response, result: ServiceResult<T>) {
    if (!result.success) {
        return res.status(result.status).json({ error: result.error });
    }
    return res.status(result.status).json(result.data);
}

export const getCarrito = async (req: Request, res: Response) => {
    const result = await getCarritoService(req.supabaseUser!, req.user!.id);
    return sendServiceResult(res, result);
};

export const addToCarrito = async (req: Request, res: Response) => {
    const { producto_id, cantidad = 1 } = req.body;
    const result = await addToCarritoService(
        req.supabaseUser!,
        req.user!.id,
        producto_id,
        cantidad
    );

    return sendServiceResult(res, result);
};

export const updateCarritoItem = async (req: Request, res: Response) => {
    const { cantidad } = req.body;
    const result = await updateCarritoItemService(
        req.supabaseUser!,
        req.user!.id,
        req.params.articuloId as string,
        cantidad
    );

    return sendServiceResult(res, result);
};

export const removeFromCarrito = async (req: Request, res: Response) => {
    const result = await removeFromCarritoService(
        req.supabaseUser!,
        req.user!.id,
        req.params.articuloId as string
    );

    return sendServiceResult(res, result);
};

export const clearCarrito = async (req: Request, res: Response) => {
    const result = await clearCarritoService(req.supabaseUser!, req.user!.id);
    return sendServiceResult(res, result);
};
