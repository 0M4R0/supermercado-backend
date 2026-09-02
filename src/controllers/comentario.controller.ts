import { Request, Response } from "express";
import {
  create_comentario,
  update_comentario,
  delete_comentario,
} from "../services/comentario.service";
import {
  sendServiceResult,
  sendValidationError,
} from "../helper/controller.helper";
import {
  comentarioIdSchema,
  createComentarioSchema,
  updateComentarioSchema,
} from "../schemas";

export async function createComentario(req: Request, res: Response) {
  // Get the parsed body from the request
  const parsedBody = createComentarioSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return sendValidationError(res, parsedBody.error);
  }

  // Create the comentario
  const result = await create_comentario(
    req.supabaseUser!,
    req.user!.id,
    parsedBody.data,
  );

  return sendServiceResult(res, result);
}

export async function updateComentario(req: Request, res: Response) {
  // Get the parsed id of the comentario
  const parsedId = comentarioIdSchema.safeParse(req.params);
  if (!parsedId.success) {
    return sendValidationError(res, parsedId.error);
  }

  // Get the parsed body from the request
  const parsedBody = updateComentarioSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return sendValidationError(res, parsedBody.error);
  }

  // Update the comentario
  const result = await update_comentario(
    req.supabaseUser!,
    req.user!.id,
    parsedId.data.comentarioId,
    parsedBody.data,
  );

  return sendServiceResult(res, result);
}

export async function deleteComentario(req: Request, res: Response) {
  // Get the parsed id of the comentario
  const parsedId = comentarioIdSchema.safeParse(req.params);
  if (!parsedId.success) {
    return sendValidationError(res, parsedId.error);
  }

  // Delete the comentario
  const result = await delete_comentario(
    req.supabaseUser!,
    req.user!.id,
    parsedId.data.comentarioId,
  );

  return sendServiceResult(res, result);
}
