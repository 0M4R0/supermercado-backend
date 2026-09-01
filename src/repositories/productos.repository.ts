import { supabase } from "../config/supabase";
import type { SortParams } from "../utils/parse-query";

const PRODUCT_LIST_SELECT = `
    producto_id,
    nombre,
    descripcion,
    precio,
    imagen_producto,
    rating_promedio,
    rating_count,
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
    rating_promedio,
    rating_count,
    created_at,
    producto_inventario (stock, min_stock, max_stock),
    producto_categoria (categorias (id, nombre)),
    proveedores (nombre)
`;

export type ProductoListItem = Record<string, unknown>;

export type FindProductosParams = {
  from: number;
  to: number;
  sort: SortParams;
  productoIds?: number[];
};

export type FindProductosResult = {
  data: ProductoListItem[];
  count: number;
};

export async function findProductIdsByCategories(
  categoriaIds: number[],
): Promise<number[]> {
  const { data, error } = await supabase
    .from("producto_categoria")
    .select("producto_id")
    .in("categoria_id", categoriaIds);

  if (error) throw new Error(error.message);

  return [...new Set((data ?? []).map((row) => row.producto_id as number))];
}

export async function findProductos(
  params: FindProductosParams,
): Promise<FindProductosResult> {
  let query = supabase
    .from("productos")
    .select(PRODUCT_LIST_SELECT, { count: "exact" })
    .eq("activo", true);

  if (params.productoIds?.length) {
    query = query.in("producto_id", params.productoIds);
  }

  const { data, error, count } = await query
    .order(params.sort.column, { ascending: params.sort.ascending })
    .range(params.from, params.to);

  if (error) throw new Error(error.message);

  return {
    data: (data ?? []) as ProductoListItem[],
    count: count ?? 0,
  };
}

export async function findProductoById(productoId: number) {
  const { data, error } = await supabase
    .from("productos")
    .select(PRODUCT_DETAIL_SELECT)
    .eq("producto_id", productoId)
    .eq("activo", true)
    .single();

  if (error) return null;
  return data;
}

export async function findCategorias() {
  const { data, error } = await supabase
    .from("categorias")
    .select("id, nombre")
    .eq("activo", true)
    .order("nombre");

  if (error) {
    console.error("Supabase error", error);
    throw new Error("SERVER_ERROR");
  }
  return data ?? [];
}
