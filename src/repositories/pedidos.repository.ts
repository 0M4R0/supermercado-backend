import type { SupabaseClient } from "@supabase/supabase-js";

export type UserOrderRow = {
    pedido_id: number;
    codigo_seguimiento: string;
    estado: string;
    total: number;
    fecha_pedido: string;
    resumen_productos: string;
    cantidad_productos: number;
    imagenes_productos: string[] | null;
    total_pedidos: number;
};

export type GetUserOrdersParams = {
    limit: number;
    offset: number;
};

/**
 * Calls get_user_orders() as the authenticated user (auth.uid() in the SP).
 * Pagination only — no business logic.
 */
export async function getUserOrders(
    supabaseUser: SupabaseClient,
    params: GetUserOrdersParams
) {
    return supabaseUser.rpc("get_user_orders", {
        p_limit: params.limit,
        p_offset: params.offset,
    });
}


// TODO; Add function to get the details of an order uwing the id
