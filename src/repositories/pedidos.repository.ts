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
  params: GetUserOrdersParams,
) {
  return supabaseUser.rpc("get_user_orders", {
    p_limit: params.limit,
    p_offset: params.offset,
  });
}

export async function findOrderByCodigo(
  supabaseUser: SupabaseClient,
  codigo: string,
) {
  return supabaseUser
    .from("pedidos")
    .select(
      `
            id,
            codigo_seguimiento,
            total,
            fecha_pedido,
            cancelable_until,
            estado_pedido (estado),
            productos:detalles_pedido (
                producto_id,
                cantidad,
                precio_unitario,
                subtotal,
                producto:productos (nombre, imagen_producto)
            ),
            entrega:entregas (
                fecha_programada,
                estado_entrega (estado),
                ubicacion (direccion, ciudad, provincia)
            ),
            pago:pagos (
                referencia_transaccion,
                estado_pago (estado),
                metodo_pago (nombre),
                usuario_metodo_pago (marca, ultimos_4)
            )
        `,
    )
    .eq("codigo_seguimiento", codigo)
    .single();
}
