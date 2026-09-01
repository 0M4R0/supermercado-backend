import type { Request, Response } from "express";
import { checkout, type ServiceResult } from "../services/checkout.service";
import {
  sendServiceResult,
  sendValidationError,
} from "../helper/controller.helper";
import { checkoutSchema } from "../schemas";

export const postCheckout = async (req: Request, res: Response) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  const result = await checkout(req.supabaseUser!, req.user!.id, parsed.data);
  return sendServiceResult(res, result);
};
