export type Comentario = {
  id: number;
  user_id: string;
  username: string;
  producto_id: number;
  description: string;
  calificacion: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type ValidatedComentarioData = {
  productoId: number;
  description: string;
  calificacion: number;
};
