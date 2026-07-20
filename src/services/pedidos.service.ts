import type { SupabaseClient } from "@supabase/supabase-js";
import {
    getUserOrders,
    type UserOrderRow,
} from "../repositories/pedidos.repository.js";
import {
    buildPaginatedResponse,
    parsePagination,
    type PaginatedResponse,
} from "../utils/pagination.js";

export type ServiceResult<T> =
    | { success: true; status: number; data: T }
    | { success: false; status: number; error: string };

export type PedidoListItem = {
    pedido_id: number;
    codigo_seguimiento: string;
    estado: string;
    total: number;
    fecha_pedido: string;
    resumen_productos: string;
    cantidad_productos: number;
    imagenes_productos: string[];
};

function mapRpcError(message: string): { status: number; error: string } {
    const msg = message || "Error al obtener los pedidos";

    if (/no autenticado/i.test(msg)) {
        return { status: 401, error: msg };
    }

    return { status: 500, error: msg };
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

function toListItem(row: UserOrderRow): PedidoListItem {
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

export async function listPedidos(
    supabaseUser: SupabaseClient,
    pageRaw: unknown,
    limitRaw: unknown
): Promise<ServiceResult<PaginatedResponse<PedidoListItem>>> {
    const pagination = parsePagination(pageRaw, limitRaw);
    const offset = (pagination.page - 1) * pagination.limit;

    const { data, error } = await getUserOrders(supabaseUser, {
        limit: pagination.limit,
        offset,
    });

    if (error) {
        const mapped = mapRpcError(error.message);
        return { success: false, status: mapped.status, error: mapped.error };
    }

    const rows = normalizeOrderRows(data);
    const first = rows[0];
    const total = first ? first.total_pedidos : 0;

    return {
        success: true,
        status: 200,
        data: buildPaginatedResponse(
            rows.map(toListItem),
            total,
            pagination
        ),
    };
}
