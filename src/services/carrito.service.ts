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
} from "../repositories/carrito.repository.js";
import {
    calcSubtotal,
    calcTotalItems,
    normalizeArticulos,
    type ArticuloRow,
} from "../utils/carrito.utils.js";

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
    articulosRaw: unknown
): CartSnapshot {
    const articulos = normalizeArticulos(articulosRaw);
    return {
        carrito_id: carritoId ?? null,
        articulos,
        subtotal: calcSubtotal(articulos),
        total_items: calcTotalItems(articulos),
    };
}

async function ensureActiveCart(
    supabaseUser: SupabaseClient,
    userId: string
): Promise<{ carrito_id: number } | { error: string }> {
    const { data: existing, error: fetchError } = await findActiveCart(
        supabaseUser,
        userId
    );
    if (fetchError) return { error: fetchError.message };

    if (existing) return { carrito_id: existing.carrito_id };

    const { data: created, error: createError } = await createActiveCart(
        supabaseUser,
        userId
    );

    if (createError) return { error: createError.message };
    return { carrito_id: created.carrito_id };
}

async function verifyCartItemOwnership(
    supabaseUser: SupabaseClient,
    userId: string,
    articuloId: number
) {
    const { data: carrito, error: cartError } = await findActiveCart(
        supabaseUser,
        userId
    );
    if (cartError) return { error: cartError.message, status: 500 as const };
    if (!carrito) return { error: "Carrito no encontrado", status: 404 as const };

    const { data: articulo, error: itemError } = await findCartItemById(
        supabaseUser,
        articuloId,
        carrito.carrito_id
    );

    if (itemError) return { error: itemError.message, status: 500 as const };
    if (!articulo) {
        return { error: "Artículo no encontrado en el carrito", status: 404 as const };
    }

    return { articulo, carrito_id: carrito.carrito_id };
}

export async function getCarrito(
    supabaseUser: SupabaseClient,
    userId: string
): Promise<ServiceResult<GetCarritoData>> {
    const { data, error } = await findCartWithItems(supabaseUser, userId);
    if (error) {
        return { success: false, status: 500, error: error.message };
    }

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
    cantidad: unknown = 1
): Promise<ServiceResult<CartSnapshot>> {
    if (!producto_id) {
        return { success: false, status: 400, error: "producto_id es requerido" };
    }

    const qty = Math.max(1, parseInt(String(cantidad), 10) || 1);
    const productoId = parseInt(String(producto_id), 10);

    const producto = await findProductStock(productoId);
    if (!producto) {
        return { success: false, status: 404, error: "Producto no encontrado" };
    }
    if (producto.stock < qty) {
        return { success: false, status: 400, error: "Stock insuficiente" };
    }

    const cartResult = await ensureActiveCart(supabaseUser, userId);
    if ("error" in cartResult) {
        return { success: false, status: 500, error: cartResult.error };
    }

    const { data: existing, error: existingError } = await findCartItemByProduct(
        supabaseUser,
        cartResult.carrito_id,
        productoId
    );

    if (existingError) {
        return { success: false, status: 500, error: existingError.message };
    }

    if (existing) {
        const newQty = existing.cantidad + qty;
        if (producto.stock < newQty) {
            return { success: false, status: 400, error: "Stock insuficiente" };
        }

        const { error: updateError } = await updateCartItem(
            supabaseUser,
            existing.articulo_carrito_id,
            {
                cantidad: newQty,
                precio_unitario: producto.precio,
                actualizado_en: new Date().toISOString(),
            }
        );

        if (updateError) {
            return { success: false, status: 500, error: updateError.message };
        }
    } else {
        const { error: insertError } = await insertCartItem(supabaseUser, {
            carrito_id: cartResult.carrito_id,
            producto_id: productoId,
            cantidad: qty,
            precio_unitario: producto.precio,
            descuento_aplicado: 0,
        });

        if (insertError) {
            return { success: false, status: 500, error: insertError.message };
        }
    }

    const { data: carrito, error: cartError } = await findCartWithItems(
        supabaseUser,
        userId
    );
    if (cartError) {
        return { success: false, status: 500, error: cartError.message };
    }

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
    cantidad: unknown
): Promise<ServiceResult<CartSnapshot>> {
    const articuloId = parseInt(articuloIdRaw, 10);

    if (isNaN(articuloId)) {
        return { success: false, status: 400, error: "ID de artículo inválido" };
    }

    const qty = parseInt(String(cantidad), 10);
    if (!qty || qty < 1) {
        return { success: false, status: 400, error: "cantidad debe ser al menos 1" };
    }

    const ownership = await verifyCartItemOwnership(
        supabaseUser,
        userId,
        articuloId
    );
    if ("error" in ownership && ownership.status) {
        return {
            success: false,
            status: ownership.status,
            error: ownership.error,
        };
    }

    const producto = await findProductStock(ownership.articulo!.producto_id);
    if (!producto) {
        return { success: false, status: 404, error: "Producto no encontrado" };
    }
    if (producto.stock < qty) {
        return { success: false, status: 400, error: "Stock insuficiente" };
    }

    const { error: updateError } = await updateCartItem(supabaseUser, articuloId, {
        cantidad: qty,
        precio_unitario: producto.precio,
        actualizado_en: new Date().toISOString(),
    });

    if (updateError) {
        return { success: false, status: 500, error: updateError.message };
    }

    const { data: carrito, error: cartError } = await findCartWithItems(
        supabaseUser,
        userId
    );
    if (cartError) {
        return { success: false, status: 500, error: cartError.message };
    }

    return {
        success: true,
        status: 200,
        data: buildCartSnapshot(carrito?.carrito_id, carrito?.articulo_carrito),
    };
}

export async function removeFromCarrito(
    supabaseUser: SupabaseClient,
    userId: string,
    articuloIdRaw: string
): Promise<ServiceResult<CartSnapshot>> {
    const articuloId = parseInt(articuloIdRaw, 10);

    if (isNaN(articuloId)) {
        return { success: false, status: 400, error: "ID de artículo inválido" };
    }

    const ownership = await verifyCartItemOwnership(
        supabaseUser,
        userId,
        articuloId
    );
    if ("error" in ownership && ownership.status) {
        return {
            success: false,
            status: ownership.status,
            error: ownership.error,
        };
    }

    const { error: deleteError } = await deleteCartItem(supabaseUser, articuloId);

    if (deleteError) {
        return { success: false, status: 500, error: deleteError.message };
    }

    const { data: carrito, error: cartError } = await findCartWithItems(
        supabaseUser,
        userId
    );
    if (cartError) {
        return { success: false, status: 500, error: cartError.message };
    }

    return {
        success: true,
        status: 200,
        data: buildCartSnapshot(
            carrito?.carrito_id ?? null,
            carrito?.articulo_carrito
        ),
    };
}

export async function clearCarrito(
    supabaseUser: SupabaseClient,
    userId: string
): Promise<ServiceResult<CartSnapshot>> {
    const { data: carrito, error: cartError } = await findActiveCart(
        supabaseUser,
        userId
    );
    if (cartError) {
        return { success: false, status: 500, error: cartError.message };
    }

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
        carrito.carrito_id
    );

    if (deleteError) {
        return { success: false, status: 500, error: deleteError.message };
    }

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
