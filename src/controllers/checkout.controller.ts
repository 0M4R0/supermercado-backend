import type { Request, Response } from "express";
import { checkout, type ServiceResult } from "../services/checkout.service";
import { sendServiceResult } from "../helper/controller.helper";

export const postCheckout = async (req: Request, res: Response) => {
  const result = await checkout(
    req.supabaseUser!,
    req.user!.id,
    (req.body ?? {}) as Record<string, unknown>,
  );
  return sendServiceResult(res, result);
};
