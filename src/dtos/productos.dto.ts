export type ProductListItemDto = {
  producto_id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagen_producto: string | null;
  created_at: string;
  producto_inventario: {
    stock: number;
    min_stock: number;
    max_stock: number;
  } | null;
  producto_categorias: {
    id: number;
    nombre: string;
  }[];
};

export type ProductDetailDto = ProductListItemDto & {
  proveedores: { nombre: string } | null;
};
