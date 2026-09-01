import { z } from "zod";

export const checkoutSchema = z
  .object({
    ubicacion_id: z.coerce.number().int().positive(),
    usuario_metodo_pago_id: z.coerce.number().int().positive().optional(),
    metodo_pago_id: z.coerce.number().int().positive().optional(),
    estado_pago_id: z.coerce.number().int().positive().optional(),
    referencia_transaccion: z.string().trim().max(255).nullable().optional(),
  })
  .refine(
    (data) =>
      data.usuario_metodo_pago_id !== undefined ||
      data.metodo_pago_id !== undefined,
    "Must indicate: usuario_metodo_pago_id or metodo_pago_id",
  );
