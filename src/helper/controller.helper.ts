import type { Request, Response } from "express";
import { type ServiceResult } from "../services/ubicaciones.service";

export function sendServiceResult<T>(res: Response, result: ServiceResult<T>) {
  if (!result.success) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.status(result.status).json(result.data);
}
