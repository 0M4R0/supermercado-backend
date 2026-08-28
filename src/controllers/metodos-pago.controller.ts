import type { Request, Response } from "express";
import {
  createPaymentMethod,
  deletePaymentMethod,
  listPaymentMethods,
  updatePaymentMethod,
  type ServiceResult,
} from "../services/metodos-pago.service";
import { sendServiceResult } from "../helper/controller.helper";

export const getPaymentMethods = async (req: Request, res: Response) => {
  const result = await listPaymentMethods(req.supabaseUser!, req.user!.id);
  return sendServiceResult(res, result);
};

export const postPaymentMethod = async (req: Request, res: Response) => {
  const result = await createPaymentMethod(
    req.supabaseUser!,
    req.user!.id,
    (req.body ?? {}) as Record<string, unknown>,
  );
  return sendServiceResult(res, result);
};

export const putPaymentMethod = async (req: Request, res: Response) => {
  const result = await updatePaymentMethod(
    req.supabaseUser!,
    req.user!.id,
    req.params.id as string,
    (req.body ?? {}) as Record<string, unknown>,
  );
  return sendServiceResult(res, result);
};

export const removePaymentMethod = async (req: Request, res: Response) => {
  const result = await deletePaymentMethod(
    req.supabaseUser!,
    req.user!.id,
    req.params.id as string,
  );

  return sendServiceResult(res, result);
};
