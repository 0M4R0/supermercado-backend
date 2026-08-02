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

export type PedidoDetailProductoDto = {
  producto_id: number;
  nombre: string;
  imagen_producto: string | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
};

export type PedidoDetailEntregaDto = {
  estado_entrega: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  fecha_programada: string | null;
} | null;

export type PedidoDetailPagoDto = {
  estado_pago: string;
  referencia_transaccion: string | null;
  metodo_pago: string;
  tarjeta: { marca: string; ultimos_4: string } | null;
} | null;

export type PedidoDetailDto = {
  pedido_id: number;
  codigo_seguimiento: string;
  estado: string;
  total: number;
  fecha_pedido: string;
  cancelable_until: string | null;
  productos: PedidoDetailProductoDto[];
  entrega: PedidoDetailEntregaDto;
  pago: PedidoDetailPagoDto;
};
