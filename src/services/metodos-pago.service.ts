import type { SupabaseClient } from "@supabase/supabase-js";
import {
  findMetodoPagoById,
  findUserPaymentMethodById,
  findUserPaymentMethods,
  insertUserPaymentMethod,
  softDeleteUserPaymentMethod,
  updateUserPaymentMethod,
  type UsuarioMetodoPagoRow,
} from "../repositories/metodos-pago.repository";
import type { PaymentMethodPublic } from "../dtos/metodopago.dto";

export type ServiceResult<T> =
  | { success: true; status: number; data: T }
  | { success: false; status: number; error: string };

const MAX_ALIAS = 100;
const MAX_TOKEN = 255;
const MAX_MARCA = 50;

const CASH_METHOD_NAMES = new Set(["efectivo", "cash"]);

/** Fields that must never be accepted or persisted. */
const FORBIDDEN_CARD_FIELDS = [
  "numero",
  "numero_tarjeta",
  "card_number",
  "pan",
  "cvv",
  "cvc",
  "codigo_seguridad",
  "pin",
  "expiracion",
  "fecha_expiracion",
  "expiry",
  "exp_month",
  "exp_year",
  "mes_expiracion",
  "anio_expiracion",
];

type ValidatedCreate = {
  metodo_pago_id: number;
  alias: string | null;
  ultimos_4: string | null;
  token: string | null;
  marca: string | null;
};

type ValidatedUpdate = {
  metodo_pago_id?: number;
  alias?: string | null;
  ultimos_4?: string | null;
  token?: string | null;
  marca?: string | null;
};

function toPublic(row: UsuarioMetodoPagoRow): PaymentMethodPublic {
  return {
    id: row.id,
    metodo_pago_id: row.metodo_pago_id,
    alias: row.alias,
    ultimos_4: row.ultimos_4,
    marca: row.marca,
    activo: row.activo,
    created_at: row.created_at,
  };
}

function findSensitiveFieldError(body: Record<string, unknown>): string | null {
  for (const field of FORBIDDEN_CARD_FIELDS) {
    if (body[field] !== undefined) {
      return `Sensible card data is not allowed (${field})`;
    }
  }
  return null;
}

function parseOptionalString(
  value: unknown,
  field: string,
  maxLen: number,
): { value: string | null } | { error: string } {
  if (value === undefined || value === null || value === "") {
    return { value: null };
  }
  if (typeof value !== "string") {
    return { error: `${field} debe ser texto` };
  }
  const trimmed = value.trim();
  if (!trimmed) return { value: null };
  if (trimmed.length > maxLen) {
    return { error: `${field} cannot exceed ${maxLen} characters` };
  }
  return { value: trimmed };
}

function parseMetodoPagoId(
  value: unknown,
  required: boolean,
): { value: number | undefined } | { error: string } {
  if (value === undefined || value === null || value === "") {
    if (required) return { error: "metodo_pago_id is required" };
    return { value: undefined };
  }
  const n = typeof value === "number" ? value : parseInt(String(value), 10);
  if (!Number.isInteger(n) || n < 1) {
    return { error: "metodo_pago_id is invalid" };
  }
  return { value: n };
}

function parseUltimos4(
  value: unknown,
): { value: string | null } | { error: string } {
  if (value === undefined || value === null || value === "") {
    return { value: null };
  }
  const digits = String(value).trim();
  if (!/^\d{4}$/.test(digits)) {
    return { error: "ultimos_4 must be exactly 4 digits" };
  }
  return { value: digits };
}

function parseMethodId(raw: string): ServiceResult<number> {
  const id = parseInt(raw, 10);
  if (isNaN(id) || id < 1) {
    return {
      success: false,
      status: 400,
      error: "Invalid payment method ID",
    };
  }
  return { success: true, status: 200, data: id };
}

function badRequest(error: string): ServiceResult<never> {
  return { success: false, status: 400, error };
}

function isCashMethodName(nombre: string): boolean {
  return CASH_METHOD_NAMES.has(nombre.trim().toLowerCase());
}

function parseUpdateField(field: keyof ValidatedUpdate, value: unknown) {
  switch (field) {
    case "metodo_pago_id":
      return parseMetodoPagoId(value, true);
    case "ultimos_4":
      return parseUltimos4(value);
    case "alias":
      return parseOptionalString(value, "alias", MAX_ALIAS);
    case "token":
      return parseOptionalString(value, "token", MAX_TOKEN);
    case "marca":
      return parseOptionalString(value, "marca", MAX_MARCA);
  }
}

async function assertCardMetodoPago(
  supabaseUser: SupabaseClient,
  metodoPagoId: number,
): Promise<ServiceResult<null>> {
  const { data, error } = await findMetodoPagoById(supabaseUser, metodoPagoId);
  if (error) throw error;
  if (!data || !data.activo) {
    return {
      success: false,
      status: 400,
      error: "payment method not found or inactive",
    };
  }
  if (isCashMethodName(data.nombre as string)) {
    return {
      success: false,
      status: 400,
      error:
        "Cash is not saved as a user method; it is only used in the checkout",
    };
  }
  return { success: true, status: 200, data: null };
}

function validateCreateBody(
  body: Record<string, unknown>,
): ServiceResult<ValidatedCreate> {
  const sensitiveError = findSensitiveFieldError(body);
  if (sensitiveError) return badRequest(sensitiveError);

  const metodoPagoId = parseMetodoPagoId(body.metodo_pago_id, true);
  if ("error" in metodoPagoId) return badRequest(metodoPagoId.error);
  const alias = parseOptionalString(body.alias, "alias", MAX_ALIAS);
  if ("error" in alias) return badRequest(alias.error);
  const ultimos4 = parseUltimos4(body.ultimos_4);
  if ("error" in ultimos4) return badRequest(ultimos4.error);
  const token = parseOptionalString(body.token, "token", MAX_TOKEN);
  if ("error" in token) return badRequest(token.error);
  const marca = parseOptionalString(body.marca, "marca", MAX_MARCA);
  if ("error" in marca) return badRequest(marca.error);

  if (!ultimos4.value && !token.value) {
    return {
      success: false,
      status: 400,
      error: "Must indicate ultimos_4 or token",
    };
  }

  return {
    success: true,
    status: 200,
    data: {
      metodo_pago_id: metodoPagoId.value!,
      alias: alias.value,
      ultimos_4: ultimos4.value,
      token: token.value,
      marca: marca.value,
    },
  };
}

function validateUpdateBody(
  body: Record<string, unknown>,
): ServiceResult<ValidatedUpdate> {
  const sensitiveError = findSensitiveFieldError(body);
  if (sensitiveError) {
    return { success: false, status: 400, error: sensitiveError };
  }

  const data: ValidatedUpdate = {};
  const hasAny =
    body.metodo_pago_id !== undefined ||
    body.alias !== undefined ||
    body.ultimos_4 !== undefined ||
    body.token !== undefined ||
    body.marca !== undefined;

  if (!hasAny) {
    return {
      success: false,
      status: 400,
      error: "Must provide at least one field to update",
    };
  }

  for (const field of [
    "metodo_pago_id",
    "alias",
    "ultimos_4",
    "token",
    "marca",
  ] as const) {
    if (body[field] === undefined) continue;
    const parsed = parseUpdateField(field, body[field]);
    if ("error" in parsed) return badRequest(parsed.error);
    (data as Record<string, unknown>)[field] = parsed.value;
  }

  return { success: true, status: 200, data };
}

export async function listPaymentMethods(
  supabaseUser: SupabaseClient,
  userId: string,
): Promise<ServiceResult<PaymentMethodPublic[]>> {
  const { data, error } = await findUserPaymentMethods(supabaseUser, userId);
  if (error) throw error;
  const rows = (data ?? []) as UsuarioMetodoPagoRow[];
  return {
    success: true,
    status: 200,
    data: rows.map(toPublic),
  };
}

export async function createPaymentMethod(
  supabaseUser: SupabaseClient,
  userId: string,
  body: Record<string, unknown>,
): Promise<ServiceResult<PaymentMethodPublic>> {
  const validated = validateCreateBody(body);
  if (!validated.success) return validated;

  const catalogCheck = await assertCardMetodoPago(
    supabaseUser,
    validated.data.metodo_pago_id,
  );
  if (!catalogCheck.success) return catalogCheck;

  const { data, error } = await insertUserPaymentMethod(supabaseUser, {
    usuario_id: userId,
    ...validated.data,
  });

  if (error) throw error;

  return {
    success: true,
    status: 201,
    data: toPublic(data as UsuarioMetodoPagoRow),
  };
}

export async function updatePaymentMethod(
  supabaseUser: SupabaseClient,
  userId: string,
  methodIdRaw: string,
  body: Record<string, unknown>,
): Promise<ServiceResult<PaymentMethodPublic>> {
  const idResult = parseMethodId(methodIdRaw);
  if (!idResult.success) return idResult;

  const validated = validateUpdateBody(body);
  if (!validated.success) return validated;

  const { data: existing, error: findError } = await findUserPaymentMethodById(
    supabaseUser,
    userId,
    idResult.data,
  );
  if (findError) throw findError;
  if (!existing) {
    return {
      success: false,
      status: 404,
      error: "Payment method not found",
    };
  }

  if (validated.data.metodo_pago_id !== undefined) {
    const catalogCheck = await assertCardMetodoPago(
      supabaseUser,
      validated.data.metodo_pago_id,
    );
    if (!catalogCheck.success) return catalogCheck;
  }

  const { data, error } = await updateUserPaymentMethod(
    supabaseUser,
    userId,
    idResult.data,
    validated.data,
  );

  if (error) throw error;
  if (!data) {
    return {
      success: false,
      status: 404,
      error: "Payment method not found",
    };
  }

  return {
    success: true,
    status: 200,
    data: toPublic(data as UsuarioMetodoPagoRow),
  };
}

export async function deletePaymentMethod(
  supabaseUser: SupabaseClient,
  userId: string,
  methodIdRaw: string,
): Promise<ServiceResult<{ message: string; id: number }>> {
  const idResult = parseMethodId(methodIdRaw);
  if (!idResult.success) return idResult;

  const { data: existing, error: findError } = await findUserPaymentMethodById(
    supabaseUser,
    userId,
    idResult.data,
  );
  if (findError) throw findError;
  if (!existing) {
    return {
      success: false,
      status: 404,
      error: "Payment method not found",
    };
  }

  const { data, error } = await softDeleteUserPaymentMethod(
    supabaseUser,
    userId,
    idResult.data,
  );
  if (error) throw error;
  if (!data) {
    return {
      success: false,
      status: 404,
      error: "Payment method not found",
    };
  }

  return {
    success: true,
    status: 200,
    data: { message: "Payment method deleted", id: idResult.data },
  };
}
