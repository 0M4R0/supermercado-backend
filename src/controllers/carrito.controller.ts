import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";

const CART_STATE_ACTIVE = "activo";

type ProductoEmbed = {
    producto_id: number;
    nombre: string;
    imagen_producto: string | null;
    precio: number;
};

type ArticuloRow = {
    articulo_carrito_id: number;
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
    descuento_aplicado: number;
    productos: ProductoEmbed | ProductoEmbed[] | null;
};

function normalizeArticulos(raw: unknown): ArticuloRow[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((item) => {
        const row = item as ArticuloRow;
        const productos = Array.isArray(row.productos) ? row.productos[0] ?? null : row.productos;
        return { ...row, productos };
    });
}

function calcSubtotal(articulos: ArticuloRow[]) {
    return articulos.reduce((sum, item) => {
        const lineTotal =
            item.cantidad * item.precio_unitario - (item.descuento_aplicado ?? 0);
        return sum + lineTotal;
    }, 0);
}

async function getActiveCart(supabaseUser: NonNullable<Request["supabaseUser"]>, userId: string) {
    return supabaseUser
        .from("carrito_compras")
        .select("carrito_id")
        .eq("usuario_id", userId)
        .eq("estado", CART_STATE_ACTIVE)
        .maybeSingle();
}

async function getCartWithItems(supabaseUser: NonNullable<Request["supabaseUser"]>, userId: string) {
    return supabaseUser
        .from("carrito_compras")
        .select(`
            carrito_id, estado, created_at, actualizado_en,
            articulo_carrito (
                articulo_carrito_id, producto_id, cantidad, precio_unitario, descuento_aplicado,
                productos (producto_id, nombre, imagen_producto, precio)
            )
        `)
        .eq("usuario_id", userId)
        .eq("estado", CART_STATE_ACTIVE)
        .maybeSingle();
}

async function getProductStock(productoId: number) {
    const { data: producto, error } = await supabase
        .from("productos")
        .select(`
            producto_id, precio, activo,
            producto_inventario (stock)
        `)
        .eq("producto_id", productoId)
        .eq("activo", true)
        .single();

    if (error || !producto) return null;

    const inventario = producto.producto_inventario as { stock: number }[] | { stock: number } | null;
    const stock = Array.isArray(inventario)
        ? inventario[0]?.stock ?? 0
        : inventario?.stock ?? 0;

    return { precio: producto.precio as number, stock };
}

async function ensureActiveCart(
    supabaseUser: NonNullable<Request["supabaseUser"]>,
    userId: string
) {
    const { data: existing, error: fetchError } = await getActiveCart(supabaseUser, userId);
    if (fetchError) return { error: fetchError.message };

    if (existing) return { carrito_id: existing.carrito_id };

    const { data: created, error: createError } = await supabaseUser
        .from("carrito_compras")
        .insert({ usuario_id: userId, estado: CART_STATE_ACTIVE })
        .select("carrito_id")
        .single();

    if (createError) return { error: createError.message };
    return { carrito_id: created.carrito_id };
}

async function verifyCartItemOwnership(
    supabaseUser: NonNullable<Request["supabaseUser"]>,
    userId: string,
    articuloId: number
) {
    const { data: carrito, error: cartError } = await getActiveCart(supabaseUser, userId);
    if (cartError) return { error: cartError.message, status: 500 };
    if (!carrito) return { error: "Carrito no encontrado", status: 404 };

    const { data: articulo, error: itemError } = await supabaseUser
        .from("articulo_carrito")
        .select("articulo_carrito_id, cantidad, producto_id, carrito_id")
        .eq("articulo_carrito_id", articuloId)
        .eq("carrito_id", carrito.carrito_id)
        .maybeSingle();

    if (itemError) return { error: itemError.message, status: 500 };
    if (!articulo) return { error: "Artículo no encontrado en el carrito", status: 404 };

    return { articulo, carrito_id: carrito.carrito_id };
}

export const getCarrito = async (req: Request, res: Response) => {
    const supabaseUser = req.supabaseUser!;
    const userId = req.user!.id;

    const { data, error } = await getCartWithItems(supabaseUser, userId);
    if (error) {
        return res.status(500).json({ error: error.message });
    }

    if (!data) {
        return res.json({
            carrito_id: null,
            estado: CART_STATE_ACTIVE,
            articulos: [],
            subtotal: 0,
            total_items: 0,
        });
    }

    const articulos = normalizeArticulos(data.articulo_carrito);

    res.json({
        carrito_id: data.carrito_id,
        estado: data.estado,
        created_at: data.created_at,
        actualizado_en: data.actualizado_en,
        articulos,
        subtotal: calcSubtotal(articulos),
        total_items: articulos.reduce((sum, item) => sum + item.cantidad, 0),
    });
};

export const addToCarrito = async (req: Request, res: Response) => {
    const supabaseUser = req.supabaseUser!;
    const userId = req.user!.id;
    const { producto_id, cantidad = 1 } = req.body;

    if (!producto_id) {
        return res.status(400).json({ error: "producto_id es requerido" });
    }

    const qty = Math.max(1, parseInt(String(cantidad), 10) || 1);
    const productoId = parseInt(String(producto_id), 10);

    const producto = await getProductStock(productoId);
    if (!producto) {
        return res.status(404).json({ error: "Producto no encontrado" });
    }
    if (producto.stock < qty) {
        return res.status(400).json({ error: "Stock insuficiente" });
    }

    const cartResult = await ensureActiveCart(supabaseUser, userId);
    if ("error" in cartResult) {
        return res.status(500).json({ error: cartResult.error });
    }

    const { data: existing, error: existingError } = await supabaseUser
        .from("articulo_carrito")
        .select("articulo_carrito_id, cantidad")
        .eq("carrito_id", cartResult.carrito_id)
        .eq("producto_id", productoId)
        .maybeSingle();

    if (existingError) {
        return res.status(500).json({ error: existingError.message });
    }

    if (existing) {
        const newQty = existing.cantidad + qty;
        if (producto.stock < newQty) {
            return res.status(400).json({ error: "Stock insuficiente" });
        }

        const { error: updateError } = await supabaseUser
            .from("articulo_carrito")
            .update({
                cantidad: newQty,
                precio_unitario: producto.precio,
                actualizado_en: new Date().toISOString(),
            })
            .eq("articulo_carrito_id", existing.articulo_carrito_id);

        if (updateError) {
            return res.status(500).json({ error: updateError.message });
        }
    } else {
        const { error: insertError } = await supabaseUser.from("articulo_carrito").insert({
            carrito_id: cartResult.carrito_id,
            producto_id: productoId,
            cantidad: qty,
            precio_unitario: producto.precio,
            descuento_aplicado: 0,
        });

        if (insertError) {
            return res.status(500).json({ error: insertError.message });
        }
    }

    const { data: carrito, error: cartError } = await getCartWithItems(supabaseUser, userId);
    if (cartError) return res.status(500).json({ error: cartError.message });

    const articulos = normalizeArticulos(carrito?.articulo_carrito);

    res.status(existing ? 200 : 201).json({
        carrito_id: carrito?.carrito_id,
        articulos,
        subtotal: calcSubtotal(articulos),
        total_items: articulos.reduce((sum, item) => sum + item.cantidad, 0),
    });
};

export const updateCarritoItem = async (req: Request, res: Response) => {
    const supabaseUser = req.supabaseUser!;
    const userId = req.user!.id;
    const articuloId = parseInt(req.params.articuloId as string, 10);
    const { cantidad } = req.body;

    if (isNaN(articuloId)) {
        return res.status(400).json({ error: "ID de artículo inválido" });
    }

    const qty = parseInt(String(cantidad), 10);
    if (!qty || qty < 1) {
        return res.status(400).json({ error: "cantidad debe ser al menos 1" });
    }

    const ownership = await verifyCartItemOwnership(supabaseUser, userId, articuloId);
    if ("error" in ownership && ownership.status) {
        return res.status(ownership.status).json({ error: ownership.error });
    }

    const producto = await getProductStock(ownership.articulo!.producto_id);
    if (!producto) {
        return res.status(404).json({ error: "Producto no encontrado" });
    }
    if (producto.stock < qty) {
        return res.status(400).json({ error: "Stock insuficiente" });
    }

    const { error: updateError } = await supabaseUser
        .from("articulo_carrito")
        .update({
            cantidad: qty,
            precio_unitario: producto.precio,
            actualizado_en: new Date().toISOString(),
        })
        .eq("articulo_carrito_id", articuloId);

    if (updateError) {
        return res.status(500).json({ error: updateError.message });
    }

    const { data: carrito, error: cartError } = await getCartWithItems(supabaseUser, userId);
    if (cartError) return res.status(500).json({ error: cartError.message });

    const articulos = normalizeArticulos(carrito?.articulo_carrito);

    res.json({
        carrito_id: carrito?.carrito_id,
        articulos,
        subtotal: calcSubtotal(articulos),
        total_items: articulos.reduce((sum, item) => sum + item.cantidad, 0),
    });
};

export const removeFromCarrito = async (req: Request, res: Response) => {
    const supabaseUser = req.supabaseUser!;
    const userId = req.user!.id;
    const articuloId = parseInt(req.params.articuloId as string, 10);

    if (isNaN(articuloId)) {
        return res.status(400).json({ error: "ID de artículo inválido" });
    }

    const ownership = await verifyCartItemOwnership(supabaseUser, userId, articuloId);
    if ("error" in ownership && ownership.status) {
        return res.status(ownership.status).json({ error: ownership.error });
    }

    const { error: deleteError } = await supabaseUser
        .from("articulo_carrito")
        .delete()
        .eq("articulo_carrito_id", articuloId);

    if (deleteError) {
        return res.status(500).json({ error: deleteError.message });
    }

    const { data: carrito, error: cartError } = await getCartWithItems(supabaseUser, userId);
    if (cartError) return res.status(500).json({ error: cartError.message });

    const articulos = normalizeArticulos(carrito?.articulo_carrito);

    res.json({
        carrito_id: carrito?.carrito_id ?? null,
        articulos,
        subtotal: calcSubtotal(articulos),
        total_items: articulos.reduce((sum, item) => sum + item.cantidad, 0),
    });
};

export const clearCarrito = async (req: Request, res: Response) => {
    const supabaseUser = req.supabaseUser!;
    const userId = req.user!.id;

    const { data: carrito, error: cartError } = await getActiveCart(supabaseUser, userId);
    if (cartError) return res.status(500).json({ error: cartError.message });

    if (!carrito) {
        return res.json({
            carrito_id: null,
            articulos: [],
            subtotal: 0,
            total_items: 0,
        });
    }

    const { error: deleteError } = await supabaseUser
        .from("articulo_carrito")
        .delete()
        .eq("carrito_id", carrito.carrito_id);

    if (deleteError) {
        return res.status(500).json({ error: deleteError.message });
    }

    res.json({
        carrito_id: carrito.carrito_id,
        articulos: [],
        subtotal: 0,
        total_items: 0,
    });
};
