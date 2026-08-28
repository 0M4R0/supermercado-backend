export type ProductoEmbed = {
  producto_id: number;
  nombre: string;
  imagen_producto: string | null;
  precio: number;
};

export type ArticuloRow = {
  articulo_carrito_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  descuento_aplicado: number;
  productos: ProductoEmbed | ProductoEmbed[] | null;
};

export function normalizeArticulos(raw: unknown): ArticuloRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const row = item as ArticuloRow;
    const productos = Array.isArray(row.productos)
      ? (row.productos[0] ?? null)
      : row.productos;
    return { ...row, productos };
  });
}

export function calcSubtotal(articulos: ArticuloRow[]) {
  return articulos.reduce((sum, item) => {
    const lineTotal =
      item.cantidad * item.precio_unitario - (item.descuento_aplicado ?? 0);
    return sum + lineTotal;
  }, 0);
}

export function calcTotalItems(articulos: ArticuloRow[]) {
  return articulos.reduce((sum, item) => sum + item.cantidad, 0);
}
