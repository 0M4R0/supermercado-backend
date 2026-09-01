import { z } from "zod";

export const productoIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const productosQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  order: z.string().optional(),
  dir: z.enum(["asc", "desc"]).optional(),
  categoria_id: z.union([z.string(), z.array(z.string())]).optional(),
});
