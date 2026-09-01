import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createOrderFromCart,
  findEstadoPagoById,
  findEstadoPagoByNombre,
  type CreateOrderFromCartResult,
} from "../repositories/checkout.repository";
import { findLocationById } from "../repositories/ubicaciones.repository";
import type { CheckoutOrderResponseDto } from "../dtos/checkout.dto";
import {
  findMetodoPagoById,
  findUserPaymentMethodById,
} from "../repositories/metodos-pago.repository";

export type ServiceResult<T> =
  | { success: true; status: number; data: T }
  | { success: false; status: number; error: string };

const DEFAULT_ESTADO_PAGO = "Pendiente";

type ResolvedPayment = {
  metodoPagoId: number | null;
  usuarioMetodoPagoId: number | null;
};

function parsePositiveInt(
  value: unknown,
  field: string,
  required: boolean,
): { value: number | null } | { error: string } {
  if (value === undefined || value === null || value === "") {
    if (required) return { error: `${field} es requerido` };
    return { value: null };
  }
  const n = typeof value === "number" ? value : parseInt(String(value), 10);
  if (!Number.isInteger(n) || n < 1) {
    return { error: `${field} inválido` };
  }
  return { value: n };
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

/**
 * Mirrors create_order_from_cart payment rules:
 * - If a saved card id is provided, that path wins (metodo_pago resolved inside the SP).
 * - Otherwise a catalog metodo_pago_id is required (e.g. cash).
 */
function parsePaymentSelection(
  body: Record<string, unknown>,
): ServiceResult<ResolvedPayment> {
  const usuarioMetodo = parsePositiveInt(
    body.usuario_metodo_pago_id,
    "usuario_metodo_pago_id",
    false,
  );
  if ("error" in usuarioMetodo) {
    return { success: false, status: 400, error: usuarioMetodo.error };
  }

  const metodoPago = parsePositiveInt(
    body.metodo_pago_id,
    "metodo_pago_id",
    false,
  );
  if ("error" in metodoPago) {
    return { success: false, status: 400, error: metodoPago.error };
  }

  if (usuarioMetodo.value !== null) {
    return {
      success: true,
      status: 200,
      data: {
        usuarioMetodoPagoId: usuarioMetodo.value,
        // SP ignores catalog id when a saved method is provided
        metodoPagoId: null,
      },
    };
  }

  if (metodoPago.value !== null) {
    return {
      success: true,
      status: 200,
      data: {
        usuarioMetodoPagoId: null,
        metodoPagoId: metodoPago.value,
      },
    };
  }

  return {
    success: false,
    status: 400,
    error:
      "Must provide either usuario_metodo_pago_id (card) or metodo_pago_id (cash)",
  };
}

function mapRpcError(
  message: string,
): { status: number; error: string } | undefined {
  const msg = message || "Error al crear el pedido";

  if (/no autenticado/i.test(msg)) {
    return { status: 401, error: msg };
  }
  if (/ubicación no pertenece/i.test(msg)) {
    return { status: 400, error: msg };
  }
  if (/método de pago guardado no pertenece/i.test(msg)) {
    return { status: 400, error: msg };
  }
  if (/debe indicar un método de pago/i.test(msg)) {
    return { status: 400, error: msg };
  }
  if (/no existe un carrito activo/i.test(msg)) {
    return { status: 400, error: msg };
  }
  if (/carrito está vacío/i.test(msg)) {
    return { status: 400, error: msg };
  }
  if (/límite de pedidos activos/i.test(msg)) {
    return { status: 409, error: msg };
  }
  if (/ya no están disponibles/i.test(msg)) {
    return { status: 409, error: msg };
  }
  if (/stock insuficiente/i.test(msg)) {
    return { status: 409, error: msg };
  }

  return undefined;
}

function normalizeRpcResult(data: unknown): CreateOrderFromCartResult | null {
  if (!data) return null;

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return null;

  const r = row as Record<string, unknown>;
  if (r.pedido_id == null || r.codigo_seguimiento == null) return null;

  return {
    pedido_id: Number(r.pedido_id),
    codigo_seguimiento: String(r.codigo_seguimiento),
    total: Number(r.total),
    estado_pedido: String(r.estado_pedido ?? "Pendiente"),
  };
}

async function resolveEstadoPagoId(
  supabaseUser: SupabaseClient,
  body: Record<string, unknown>,
): Promise<ServiceResult<number>> {
  const fromBody = parsePositiveInt(
    body.estado_pago_id,
    "estado_pago_id",
    false,
  );
  if ("error" in fromBody) {
    return { success: false, status: 400, error: fromBody.error };
  }

  if (fromBody.value !== null) {
    const { data, error } = await findEstadoPagoById(
      supabaseUser,
      fromBody.value,
    );
    if (error) throw error;
    if (!data) {
      return {
        success: false,
        status: 400,
        error: "estado_pago_id no válido",
      };
    }
    return { success: true, status: 200, data: fromBody.value };
  }

  const { data, error } = await findEstadoPagoByNombre(
    supabaseUser,
    DEFAULT_ESTADO_PAGO,
  );
  if (error) throw error;
  if (!data) {
    throw new Error("No se encontró el estado de pago predeterminado");
  }
  return { success: true, status: 200, data: data.id as number };
}

export async function checkout(
  supabaseUser: SupabaseClient,
  userId: string,
  body: Record<string, unknown>,
): Promise<ServiceResult<CheckoutOrderResponseDto>> {
  const ubicacionId = parsePositiveInt(body.ubicacion_id, "ubicacion_id", true);
  if ("error" in ubicacionId) {
    return { success: false, status: 400, error: ubicacionId.error };
  }

  const payment = parsePaymentSelection(body);
  if (!payment.success) return payment;

  const referencia = parseOptionalString(
    body.referencia_transaccion,
    "referencia_transaccion",
    255,
  );
  if ("error" in referencia) {
    return { success: false, status: 400, error: referencia.error };
  }

  // Location must belong to the authenticated user
  const { data: ubicacion, error: ubicacionError } = await findLocationById(
    supabaseUser,
    userId,
    ubicacionId.value!,
  );
  if (ubicacionError) throw ubicacionError;
  if (!ubicacion) {
    return {
      success: false,
      status: 400,
      error: "Ubicación no pertenece al usuario",
    };
  }

  // Payment method decision (same semantics as the stored procedure)
  if (payment.data.usuarioMetodoPagoId !== null) {
    const { data: card, error: cardError } = await findUserPaymentMethodById(
      supabaseUser,
      userId,
      payment.data.usuarioMetodoPagoId,
    );
    if (cardError) throw cardError;
    if (!card) {
      return {
        success: false,
        status: 400,
        error: "Payment method does not belong to the user",
      };
    }
  } else if (payment.data.metodoPagoId !== null) {
    const { data: metodo, error: metodoError } = await findMetodoPagoById(
      supabaseUser,
      payment.data.metodoPagoId,
    );
    if (metodoError) throw metodoError;
    if (!metodo || !metodo.activo) {
      return {
        success: false,
        status: 400,
        error: "Invalid or inactive payment method",
      };
    }
  }

  const estadoPago = await resolveEstadoPagoId(supabaseUser, body);
  if (!estadoPago.success) return estadoPago;

  const { data, error } = await createOrderFromCart(supabaseUser, {
    ubicacionId: ubicacionId.value!,
    estadoPagoId: estadoPago.data,
    referenciaTransaccion: referencia.value,
    metodoPagoId: payment.data.metodoPagoId,
    usuarioMetodoPagoId: payment.data.usuarioMetodoPagoId,
  });

  if (error) {
    const mapped = mapRpcError(error.message);
    if (mapped)
      return { success: false, status: mapped.status, error: mapped.error };
    throw error;
  }

  const order = normalizeRpcResult(data);
  if (!order) {
    throw new Error("The order was processed without a valid result");
  }

  return {
    success: true,
    status: 201,
    data: order,
  };
}
