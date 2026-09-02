export type ProductListItemDto = {
  producto_id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagen_producto: string | null;
  created_at: string;
  rating_promedio: number | null;
  rating_count: number | null;
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

export type ProductCommentDto = {
  id: number;
  user_id: string;
  producto_id: number;
  user: {
    nombre: string | null;
    username: string;
  };
  description: string;
  calificacion: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductDetailDto = ProductListItemDto & {
  proveedores: { nombre: string } | null;
  comentarios: ProductCommentDto[];
};
