import type { Request, Response } from "express";
import {
    listPedidos,
    getOrderDetails,
    type ServiceResult,
} from "../services/pedidos.service";
import { sendServiceResult } from "../helper/controller.helper";

export const getPedidos = async (req: Request, res: Response) => {
    const { page, limit } = req.query;
    const result = await listPedidos(req.supabaseUser!, page, limit);
    return sendServiceResult(res, result);
};

interface PedidoDetailsParams {
    codigo: string;
}

export const getPedidoDetails = async (req: Request<PedidoDetailsParams>, res: Response) => {
    const { codigo } = req.params;
    const result = await getOrderDetails(req.supabaseUser!, codigo);
    return sendServiceResult(res, result);
};
