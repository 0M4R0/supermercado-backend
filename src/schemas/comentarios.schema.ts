import { z } from "zod";

export const comentarioProductoIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const comentarioIdSchema = z.object({
  comentarioId: z.coerce.number().int().positive(),
});

export const createComentarioSchema = z.object({
  description: z.string().trim().min(1).max(1000),
  calificacion: z.coerce.number().int().min(1).max(5),
});

export const updateComentarioSchema = z
  .object({
    description: z.string().trim().min(1).max(1000).optional(),
    calificacion: z.coerce.number().int().min(1).max(5).optional(),
  })
  .refine(
    (data) => data.description !== undefined || data.calificacion !== undefined,
    "Must send at least one field to update",
  );
