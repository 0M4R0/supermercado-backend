import { z } from "zod";

const fields = {
  metodo_pago_id: z.coerce.number().int().positive(),
  alias: z.string().trim().max(100).nullable().optional(),
  ultimos_4: z
    .string()
    .regex(/^\d{4}$/)
    .nullable()
    .optional(),
  token: z.string().trim().max(255).nullable().optional(),
  marca: z.string().trim().max(50).nullable().optional(),
};

export const createPaymentMethodSchema = z
  .looseObject(fields)
  .superRefine((data, ctx) => {
    if (!data.ultimos_4 && !data.token) {
      ctx.addIssue({
        code: "custom",
        message: "Must provide either ultimos_4 or token of the card",
      });
    }
  });

export const updatePaymentMethodSchema = z
  .looseObject(fields)
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Must send at least one field to update",
  );

export const paymentMethodIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});
