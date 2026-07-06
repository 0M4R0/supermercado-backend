import { supabase } from "../config/supabase.js";
import {
    buildPaginatedResponse,
    type PaginatedResponse,
    type PaginationParams,
} from "../utils/pagination.js";
import type { SortParams } from "../utils/parse-query.js";

const PRODUCT_LIST_SELECT = `
    producto_id,
    nombre,
    descripcion,
    precio,
    imagen_producto,
    created_at,
    producto_inventario (stock, min_stock, max_stock),
    producto_categoria (categoria_id, categorias (id, nombre))
`;

const PRODUCT_DETAIL_SELECT = `
    producto_id,
    nombre,
    descripcion,
    precio,
    imagen_producto,
    created_at,
    producto_inventario (stock, min_stock, max_stock),
    producto_categoria (categorias (id, nombre)),
    proveedores (nombre)
`;

export type ProductoListItem = Record<string, unknown>;

async function getProductIdsByCategories(categoriaIds: number[]): Promise<number[]> {
    const { data, error } = await supabase
        .from("producto_categoria")
        .select("producto_id")
        .in("categoria_id", categoriaIds);

    if (error) throw new Error(error.message);

    return [...new Set((data ?? []).map((row) => row.producto_id as number))];
}

export async function fetchProductos(
    pagination: PaginationParams,
    sort: SortParams,
    categoriaIds?: number[]
): Promise<PaginatedResponse<ProductoListItem>> {
    if (categoriaIds?.length) {
        const productoIds = await getProductIdsByCategories(categoriaIds);

        if (!productoIds.length) {
            return buildPaginatedResponse([], 0, pagination);
        }

        const { data, error, count } = await supabase
            .from("productos")
            .select(PRODUCT_LIST_SELECT, { count: "exact" })
            .eq("activo", true)
            .in("producto_id", productoIds)
            .order(sort.column, { ascending: sort.ascending })
            .range(pagination.from, pagination.to);

        if (error) throw new Error(error.message);

        return buildPaginatedResponse(data ?? [], count ?? 0, pagination);
    }

    const { data, error, count } = await supabase
        .from("productos")
        .select(PRODUCT_LIST_SELECT, { count: "exact" })
        .eq("activo", true)
        .order(sort.column, { ascending: sort.ascending })
        .range(pagination.from, pagination.to);

    if (error) throw new Error(error.message);

    return buildPaginatedResponse(data ?? [], count ?? 0, pagination);
}

export async function fetchProductoById(productoId: number) {
    const { data, error } = await supabase
        .from("productos")
        .select(PRODUCT_DETAIL_SELECT)
        .eq("producto_id", productoId)
        .eq("activo", true)
        .single();

    if (error) return null;
    return data;
}

export async function fetchCategorias() {
    const { data, error } = await supabase
        .from("categorias")
        .select("id, nombre")
        .eq("activo", true)
        .order("nombre");

    if (error) throw new Error(error.message);
    return data ?? [];
}
