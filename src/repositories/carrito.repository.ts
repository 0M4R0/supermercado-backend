import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../config/supabase";

export const CART_STATE_ACTIVE = "activo";

export type ProductStock = {
  precio: number;
  stock: number;
};

export async function findActiveCart(
  supabaseUser: SupabaseClient,
  userId: string,
) {
  return supabaseUser
    .from("carrito_compras")
    .select("carrito_id")
    .eq("usuario_id", userId)
    .eq("estado", CART_STATE_ACTIVE)
    .maybeSingle();
}

export async function findCartWithItems(
  supabaseUser: SupabaseClient,
  userId: string,
) {
  return supabaseUser
    .from("carrito_compras")
    .select(
      `
            carrito_id, estado, created_at, actualizado_en,
            articulo_carrito (
                articulo_carrito_id, producto_id, cantidad, precio_unitario, descuento_aplicado,
                productos (producto_id, nombre, imagen_producto, precio)
            )
        `,
    )
    .eq("usuario_id", userId)
    .eq("estado", CART_STATE_ACTIVE)
    .maybeSingle();
}

export async function createActiveCart(
  supabaseUser: SupabaseClient,
  userId: string,
) {
  return supabaseUser
    .from("carrito_compras")
    .insert({ usuario_id: userId, estado: CART_STATE_ACTIVE })
    .select("carrito_id")
    .single();
}

export async function findProductStock(
  productoId: number,
): Promise<ProductStock | null> {
  const { data: producto, error } = await supabase
    .from("productos")
    .select(
      `
            producto_id, precio, activo,
            producto_inventario (stock)
        `,
    )
    .eq("producto_id", productoId)
    .eq("activo", true)
    .single();

  if (error || !producto) return null;

  const inventario = producto.producto_inventario as
    { stock: number }[] | { stock: number } | null;
  const stock = Array.isArray(inventario)
    ? (inventario[0]?.stock ?? 0)
    : (inventario?.stock ?? 0);

  return { precio: producto.precio as number, stock };
}

export async function findCartItemByProduct(
  supabaseUser: SupabaseClient,
  carritoId: number,
  productoId: number,
) {
  return supabaseUser
    .from("articulo_carrito")
    .select("articulo_carrito_id, cantidad")
    .eq("carrito_id", carritoId)
    .eq("producto_id", productoId)
    .maybeSingle();
}

export async function findCartItemById(
  supabaseUser: SupabaseClient,
  articuloId: number,
  carritoId: number,
) {
  return supabaseUser
    .from("articulo_carrito")
    .select("articulo_carrito_id, cantidad, producto_id, carrito_id")
    .eq("articulo_carrito_id", articuloId)
    .eq("carrito_id", carritoId)
    .maybeSingle();
}

export async function updateCartItem(
  supabaseUser: SupabaseClient,
  articuloId: number,
  values: {
    cantidad: number;
    precio_unitario: number;
    actualizado_en: string;
  },
) {
  return supabaseUser
    .from("articulo_carrito")
    .update(values)
    .eq("articulo_carrito_id", articuloId);
}

export async function insertCartItem(
  supabaseUser: SupabaseClient,
  values: {
    carrito_id: number;
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
    descuento_aplicado: number;
  },
) {
  return supabaseUser.from("articulo_carrito").insert(values);
}

export async function deleteCartItem(
  supabaseUser: SupabaseClient,
  articuloId: number,
) {
  return supabaseUser
    .from("articulo_carrito")
    .delete()
    .eq("articulo_carrito_id", articuloId);
}

export async function deleteAllCartItems(
  supabaseUser: SupabaseClient,
  carritoId: number,
) {
  return supabaseUser
    .from("articulo_carrito")
    .delete()
    .eq("carrito_id", carritoId);
}
