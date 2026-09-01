import { z } from "zod";

const optionalText = (max: number) => z.string().trim().min(1).max(max);

export const createUbicacionSchema = z.object({
  direccion: optionalText(255),
  codigo_postal: z.coerce.number().int().nonnegative().nullable().optional(),
  ciudad: optionalText(100),
  provincia: optionalText(100),
  pais: optionalText(100).optional(),
  por_defecto: z.coerce.boolean().optional(),
  direccion_extra: optionalText(150).nullable().optional(),
});

export const updateUbicacionSchema = createUbicacionSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Must indicate at least one field to update",
  );

export const ubicacionIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});
