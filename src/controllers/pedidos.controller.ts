import type { Request, Response } from "express";
import {
    listPedidos,
    type ServiceResult,
} from "../services/pedidos.service.js";

function sendServiceResult<T>(res: Response, result: ServiceResult<T>) {
    if (!result.success) {
        return res.status(result.status).json({ error: result.error });
    }
    return res.status(result.status).json(result.data);
}

export const getPedidos = async (req: Request, res: Response) => {
    const { page, limit } = req.query;
    const result = await listPedidos(req.supabaseUser!, page, limit);
    return sendServiceResult(res, result);
};
