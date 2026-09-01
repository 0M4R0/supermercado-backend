import type { Request, Response } from "express";
import {
  createPaymentMethod,
  deletePaymentMethod,
  listPaymentMethods,
  updatePaymentMethod,
  type ServiceResult,
} from "../services/metodos-pago.service";
import {
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
  paymentMethodIdSchema,
} from "../schemas";
import {
  sendServiceResult,
  sendValidationError,
} from "../helper/controller.helper";

export const getPaymentMethods = async (req: Request, res: Response) => {
  const result = await listPaymentMethods(req.supabaseUser!, req.user!.id);
  return sendServiceResult(res, result);
};

export const postPaymentMethod = async (req: Request, res: Response) => {
  const parsed = createPaymentMethodSchema.safeParse(req.query);
  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  const result = await createPaymentMethod(
    req.supabaseUser!,
    req.user!.id,
    parsed.data,
  );
  return sendServiceResult(res, result);
};

export const putPaymentMethod = async (req: Request, res: Response) => {
  const parsed = updatePaymentMethodSchema.safeParse(req.query);
  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  const result = await updatePaymentMethod(
    req.supabaseUser!,
    req.user!.id,
    req.params.id as string,
    parsed.data,
  );
  return sendServiceResult(res, result);
};

export const removePaymentMethod = async (req: Request, res: Response) => {
  const params = paymentMethodIdSchema.safeParse(req.params);
  if (!params.success) {
    return sendValidationError(res, params.error);
  }

  const result = await deletePaymentMethod(
    req.supabaseUser!,
    req.user!.id,
    String(params.data.id),
  );

  return sendServiceResult(res, result);
};
