export type PedidoListItemDto = {
  pedido_id: number;
  codigo_seguimiento: string;
  estado: string;
  total: number;
  fecha_pedido: string;
  resumen_productos: string;
  cantidad_productos: number;
  imagenes_productos: string[];
};

export type PedidoDetailDto = {

};
