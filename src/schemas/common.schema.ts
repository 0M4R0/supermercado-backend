import { z } from "zod";

export const numericIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export function zodErrorMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid data";
}
