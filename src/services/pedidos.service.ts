import type { SupabaseClient } from "@supabase/supabase-js";
import {
  findOrderByCodigo,
  getUserOrders,
  type UserOrderRow,
} from "../repositories/pedidos.repository";
import type { PedidoListItemDto, PedidoDetailDto } from "../dtos/pedidos.dto";
import {
  buildPaginatedResponse,
  parsePagination,
  type PaginatedResponse,
} from "../utils/pagination";

export type ServiceResult<T> =
  | { success: true; status: number; data: T }
  | { success: false; status: number; error: string };

function mapRpcError(
  message: string,
): { status: number; error: string } | undefined {
  const msg = message || "Error al obtener los pedidos";

  if (/no autenticado/i.test(msg)) {
    return { status: 401, error: msg };
  }

  return undefined;
}

function normalizeOrderRows(data: unknown): UserOrderRow[] {
  if (!data) return [];
  if (!Array.isArray(data)) return [];

  return data.map((row) => {
    const r = row as Record<string, unknown>;
    const imagenes = r.imagenes_productos;

    return {
      pedido_id: Number(r.pedido_id),
      codigo_seguimiento: String(r.codigo_seguimiento ?? ""),
      estado: String(r.estado ?? ""),
      total: Number(r.total ?? 0),
      fecha_pedido: String(r.fecha_pedido ?? ""),
      resumen_productos: String(r.resumen_productos ?? ""),
      cantidad_productos: Number(r.cantidad_productos ?? 0),
      imagenes_productos: Array.isArray(imagenes)
        ? imagenes.map((img) => String(img))
        : null,
      total_pedidos: Number(r.total_pedidos ?? 0),
    };
  });
}

function toListItem(row: UserOrderRow): PedidoListItemDto {
  return {
    pedido_id: row.pedido_id,
    codigo_seguimiento: row.codigo_seguimiento,
    estado: row.estado,
    total: row.total,
    fecha_pedido: row.fecha_pedido,
    resumen_productos: row.resumen_productos,
    cantidad_productos: row.cantidad_productos,
    imagenes_productos: row.imagenes_productos ?? [],
  };
}

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function toDetailDto(row: any): PedidoDetailDto {
  const entrega = firstOrNull(row.entrega);
  const pago = firstOrNull(row.pago);

  return {
    pedido_id: row.id,
    codigo_seguimiento: row.codigo_seguimiento,
    estado: row.estado_pedido?.estado ?? "desconocido",
    total: row.total,
    fecha_pedido: row.fecha_pedido,
    cancelable_until: row.cancelable_until,
    productos: (row.productos ?? []).map((item: any) => ({
      producto_id: item.producto_id,
      nombre: item.producto?.nombre ?? "",
      imagen_producto: item.producto?.imagen_producto ?? null,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      subtotal: item.subtotal,
    })),
    entrega: entrega
      ? {
          estado_entrega: entrega.estado_entrega?.estado ?? "",
          direccion: entrega.ubicacion?.direccion ?? "",
          ciudad: entrega.ubicacion?.ciudad ?? "",
          provincia: entrega.ubicacion?.provincia ?? "",
          fecha_programada: entrega.fecha_programada ?? null,
        }
      : null,
    pago: pago
      ? {
          estado_pago: pago.estado_pago?.estado ?? "",
          referencia_transaccion: pago.referencia_transaccion ?? null,
          metodo_pago: pago.metodo_pago?.nombre ?? "",
          tarjeta: pago.usuario_metodo_pago
            ? {
                marca: pago.usuario_metodo_pago.marca,
                ultimos_4: pago.usuario_metodo_pago.ultimos_4,
              }
            : null,
        }
      : null,
  };
}

export async function listPedidos(
  supabaseUser: SupabaseClient,
  pageRaw: unknown,
  limitRaw: unknown,
): Promise<ServiceResult<PaginatedResponse<PedidoListItemDto>>> {
  const pagination = parsePagination(pageRaw, limitRaw);
  const offset = (pagination.page - 1) * pagination.limit;

  const { data, error } = await getUserOrders(supabaseUser, {
    limit: pagination.limit,
    offset,
  });

  if (error) {
    const mapped = mapRpcError(error.message);
    if (mapped)
      return { success: false, status: mapped.status, error: mapped.error };
    throw error;
  }

  const rows = normalizeOrderRows(data);
  const first = rows[0];
  const total = first ? first.total_pedidos : 0;

  return {
    success: true,
    status: 200,
    data: buildPaginatedResponse(rows.map(toListItem), total, pagination),
  };
}

export async function getOrderDetails(
  supabaseUser: SupabaseClient,
  codigo: string,
): Promise<ServiceResult<PedidoDetailDto>> {
  const { data, error } = await findOrderByCodigo(supabaseUser, codigo);

  if (error) {
    if (error?.code === "PGRST116") {
      return {
        success: false,
        status: 404,
        error: "Pedido no encontrado",
      };
    }

    const mapped = mapRpcError(error.message);
    if (mapped)
      return {
        success: false,
        status: mapped.status,
        error: mapped.error,
      };
    throw error;
  }

  if (data == null) {
    return {
      success: false,
      status: 404,
      error: "Pedido no encontrado",
    };
  }

  return {
    success: true,
    status: 200,
    data: toDetailDto(data),
  };
}
