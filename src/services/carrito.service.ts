import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CART_STATE_ACTIVE,
  createActiveCart,
  deleteAllCartItems,
  deleteCartItem,
  findActiveCart,
  findCartItemById,
  findCartItemByProduct,
  findCartWithItems,
  findProductStock,
  insertCartItem,
  updateCartItem,
} from "../repositories/carrito.repository";
import {
  calcSubtotal,
  calcTotalItems,
  normalizeArticulos,
  type ArticuloRow,
} from "../utils/carrito.utils";

export type ServiceResult<T> =
  | { success: true; status: number; data: T }
  | { success: false; status: number; error: string };

type CartSnapshot = {
  carrito_id: number | null;
  articulos: ArticuloRow[];
  subtotal: number;
  total_items: number;
};

type GetCarritoData = CartSnapshot & {
  estado: string;
  created_at?: string;
  actualizado_en?: string;
};

function buildCartSnapshot(
  carritoId: number | null | undefined,
  articulosRaw: unknown,
): CartSnapshot {
  const articulos = normalizeArticulos(articulosRaw);
  return {
    carrito_id: carritoId ?? null,
    articulos,
    subtotal: calcSubtotal(articulos),
    total_items: calcTotalItems(articulos),
  };
}

async function find_active_cart(supabaseUser: SupabaseClient, userId: string) {
  const { data: cart, error: cartError } = await findActiveCart(
    supabaseUser,
    userId,
  );
  if (cartError) throw cartError;
  return cart;
}

async function create_active_cart(
  supabaseUser: SupabaseClient,
  userId: string,
) {
  const { data: created, error: createError } = await createActiveCart(
    supabaseUser,
    userId,
  );
  if (createError) throw createError;
  if (!created) throw new Error("Cart could not be created");
  return { carrito_id: created.carrito_id };
}

async function get_or_create_active_cart(
  supabaseUser: SupabaseClient,
  userId: string,
): Promise<{ carrito_id: number }> {
  const existing = await find_active_cart(supabaseUser, userId);
  if (existing) return { carrito_id: existing.carrito_id };
  return create_active_cart(supabaseUser, userId);
}

async function require_active_cart(
  supabaseUser: SupabaseClient,
  userId: string,
) {
  const cart = await find_active_cart(supabaseUser, userId);
  if (!cart) return { error: "Cart not found", status: 404 as const };
  return cart;
}

async function verifyCartItemOwnership(
  supabaseUser: SupabaseClient,
  userId: string,
  articuloId: number,
) {
  const carrito = await require_active_cart(supabaseUser, userId);
  if ("error" in carrito) return carrito;

  const { data: articulo, error: itemError } = await findCartItemById(
    supabaseUser,
    articuloId,
    carrito.carrito_id,
  );

  if (itemError) throw itemError;
  if (!articulo) {
    return {
      error: "Articulo not found in the cart",
      status: 404 as const,
    };
  }

  return { articulo, carrito_id: carrito.carrito_id };
}

export async function getCarrito(
  supabaseUser: SupabaseClient,
  userId: string,
): Promise<ServiceResult<GetCarritoData>> {
  const { data, error } = await findCartWithItems(supabaseUser, userId);
  if (error) throw error;

  if (!data) {
    return {
      success: true,
      status: 200,
      data: {
        carrito_id: null,
        estado: CART_STATE_ACTIVE,
        articulos: [],
        subtotal: 0,
        total_items: 0,
      },
    };
  }

  const articulos = normalizeArticulos(data.articulo_carrito);

  return {
    success: true,
    status: 200,
    data: {
      carrito_id: data.carrito_id,
      estado: data.estado,
      created_at: data.created_at,
      actualizado_en: data.actualizado_en,
      articulos,
      subtotal: calcSubtotal(articulos),
      total_items: calcTotalItems(articulos),
    },
  };
}

export async function addToCarrito(
  supabaseUser: SupabaseClient,
  userId: string,
  producto_id: unknown,
  cantidad: unknown = 1,
): Promise<ServiceResult<CartSnapshot>> {
  if (!producto_id) {
    return { success: false, status: 400, error: "producto_id is required" };
  }

  const qty = Math.max(1, parseInt(String(cantidad), 10) || 1);
  const productoId = parseInt(String(producto_id), 10);

  const producto = await findProductStock(productoId);
  if (!producto) {
    return { success: false, status: 404, error: "Product not found" };
  }
  if (producto.stock < qty) {
    return { success: false, status: 400, error: "Insufficient stock" };
  }

  const cartResult = await get_or_create_active_cart(supabaseUser, userId);

  const { data: existing, error: existingError } = await findCartItemByProduct(
    supabaseUser,
    cartResult.carrito_id,
    productoId,
  );

  if (existingError) throw existingError;

  if (existing) {
    const newQty = existing.cantidad + qty;
    if (producto.stock < newQty) {
      return { success: false, status: 400, error: "Insufficient stock" };
    }

    const { error: updateError } = await updateCartItem(
      supabaseUser,
      existing.articulo_carrito_id,
      {
        cantidad: newQty,
        precio_unitario: producto.precio,
        actualizado_en: new Date().toISOString(),
      },
    );

    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await insertCartItem(supabaseUser, {
      carrito_id: cartResult.carrito_id,
      producto_id: productoId,
      cantidad: qty,
      precio_unitario: producto.precio,
      descuento_aplicado: 0,
    });

    if (insertError) throw insertError;
  }

  const { data: carrito, error: cartError } = await findCartWithItems(
    supabaseUser,
    userId,
  );
  if (cartError) throw cartError;

  return {
    success: true,
    status: existing ? 200 : 201,
    data: buildCartSnapshot(carrito?.carrito_id, carrito?.articulo_carrito),
  };
}

export async function updateCarritoItem(
  supabaseUser: SupabaseClient,
  userId: string,
  articuloIdRaw: string,
  cantidad: unknown,
): Promise<ServiceResult<CartSnapshot>> {
  const articuloId = parseInt(articuloIdRaw, 10);

  if (isNaN(articuloId)) {
    return { success: false, status: 400, error: "Articulo ID is invalid" };
  }

  const qty = parseInt(String(cantidad), 10);
  if (!qty || qty < 1) {
    return {
      success: false,
      status: 400,
      error: "Quantity must be at least 1",
    };
  }

  const ownership = await verifyCartItemOwnership(
    supabaseUser,
    userId,
    articuloId,
  );
  if ("error" in ownership) {
    return {
      success: false,
      status: ownership.status,
      error: ownership.error,
    };
  }

  const producto = await findProductStock(ownership.articulo!.producto_id);
  if (!producto) {
    return { success: false, status: 404, error: "Product not found" };
  }
  if (producto.stock < qty) {
    return { success: false, status: 400, error: "Insufficient stock" };
  }

  const { error: updateError } = await updateCartItem(
    supabaseUser,
    articuloId,
    {
      cantidad: qty,
      precio_unitario: producto.precio,
      actualizado_en: new Date().toISOString(),
    },
  );

  if (updateError) throw updateError;

  const { data: carrito, error: cartError } = await findCartWithItems(
    supabaseUser,
    userId,
  );
  if (cartError) throw cartError;

  return {
    success: true,
    status: 200,
    data: buildCartSnapshot(carrito?.carrito_id, carrito?.articulo_carrito),
  };
}

export async function removeFromCarrito(
  supabaseUser: SupabaseClient,
  userId: string,
  articuloIdRaw: string,
): Promise<ServiceResult<CartSnapshot>> {
  const articuloId = parseInt(articuloIdRaw, 10);

  if (isNaN(articuloId)) {
    return { success: false, status: 400, error: "Articulo ID is invalid" };
  }

  const ownership = await verifyCartItemOwnership(
    supabaseUser,
    userId,
    articuloId,
  );
  if ("error" in ownership) {
    return {
      success: false,
      status: ownership.status,
      error: ownership.error,
    };
  }

  const { error: deleteError } = await deleteCartItem(supabaseUser, articuloId);

  if (deleteError) throw deleteError;

  const { data: carrito, error: cartError } = await findCartWithItems(
    supabaseUser,
    userId,
  );
  if (cartError) throw cartError;

  return {
    success: true,
    status: 200,
    data: buildCartSnapshot(
      carrito?.carrito_id ?? null,
      carrito?.articulo_carrito,
    ),
  };
}

export async function clearCarrito(
  supabaseUser: SupabaseClient,
  userId: string,
): Promise<ServiceResult<CartSnapshot>> {
  const carrito = await find_active_cart(supabaseUser, userId);

  if (!carrito) {
    return {
      success: true,
      status: 200,
      data: {
        carrito_id: null,
        articulos: [],
        subtotal: 0,
        total_items: 0,
      },
    };
  }

  const { error: deleteError } = await deleteAllCartItems(
    supabaseUser,
    carrito.carrito_id,
  );

  if (deleteError) throw deleteError;

  return {
    success: true,
    status: 200,
    data: {
      carrito_id: carrito.carrito_id,
      articulos: [],
      subtotal: 0,
      total_items: 0,
    },
  };
}
