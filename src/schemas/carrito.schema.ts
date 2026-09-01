import { z } from "zod";

export const addCarritoSchema = z.object({
  producto_id: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().int().positive().optional(),
});

export const updateCarritoItemSchema = z.object({
  cantidad: z.coerce.number().int().positive(),
});

export const articuloIdSchema = z.object({
  articuloId: z.coerce.number().int().positive(),
});
