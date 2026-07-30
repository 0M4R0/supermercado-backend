import type { Request, Response } from "express";
import {
    checkout,
    type ServiceResult,
} from "../services/checkout.service.js";

function sendServiceResult<T>(res: Response, result: ServiceResult<T>) {
    if (!result.success) {
        return res.status(result.status).json({ error: result.error });
    }
    return res.status(result.status).json(result.data);
}

export const postCheckout = async (req: Request, res: Response) => {
    const result = await checkout(
      req.supabaseUser!,
      req.user!.id,
      (req.body ?? {}) as Record<string, unknown>
    );
    return sendServiceResult(res, result);
};
