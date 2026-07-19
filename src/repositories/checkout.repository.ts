import type { SupabaseClient } from "@supabase/supabase-js";

export type CreateOrderFromCartParams = {
    ubicacionId: number;
    estadoPagoId: number;
    referenciaTransaccion: string | null;
    metodoPagoId: number | null;
    usuarioMetodoPagoId: number | null;
};

export type CreateOrderFromCartResult = {
    pedido_id: number;
    codigo_seguimiento: string;
    total: number;
    estado_pedido: string;
};

export async function findEstadoPagoById(
    supabaseUser: SupabaseClient,
    estadoPagoId: number
) {
    return supabaseUser
        .from("estado_pago")
        .select("id, estado")
        .eq("id", estadoPagoId)
        .maybeSingle();
}

export async function findEstadoPagoByNombre(
    supabaseUser: SupabaseClient,
    estado: string
) {
    return supabaseUser
        .from("estado_pago")
        .select("id, estado")
        .eq("estado", estado)
        .maybeSingle();
}

/**
 * Calls create_order_from_cart() as the authenticated user (auth.uid() in the SP).
 * No business logic — only the RPC and raw result shaping.
 */
export async function createOrderFromCart(
    supabaseUser: SupabaseClient,
    params: CreateOrderFromCartParams
) {
    return supabaseUser.rpc("create_order_from_cart", {
        p_ubicacion_id: params.ubicacionId,
        p_estado_pago_id: params.estadoPagoId,
        p_referencia_transaccion: params.referenciaTransaccion,
        p_metodo_pago_id: params.metodoPagoId,
        p_usuario_metodo_pago_id: params.usuarioMetodoPagoId,
    });
}
