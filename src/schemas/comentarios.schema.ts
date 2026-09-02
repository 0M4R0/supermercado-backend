import { z } from "zod";

// Used to get the id of a product
export const comentarioProductoIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Used to get the id of a comentario
export const comentarioIdSchema = z.object({
  comentarioId: z.coerce.number().int().positive(),
});

// Used to create a comentario
export const createComentarioSchema = z.object({
  productoId: z.coerce.number().int().positive(),
  description: z.string().trim().min(1).max(1000),
  calificacion: z.coerce.number().int().min(1).max(5),
});

// Used to update a comentario
export const updateComentarioSchema = z
  .object({
    description: z.string().trim().min(1).max(1000).optional(),
    calificacion: z.coerce.number().int().min(1).max(5).optional(),
  })
  .refine(
    (data) => data.description !== undefined || data.calificacion !== undefined,
    "Must send at least one field to update",
  );
