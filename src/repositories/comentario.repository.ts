import { supabase } from "../config/supabase";

const COMENTARIO_SELECT = `
    id,
    user_id,
    producto_id,
    description,
    calificacion,
    created_at,
    updated_at
`;

export type ComentarioRow = Record<string, unknown>;

export type FindComentariosParams = {
  productoId: number;
  from: number;
  to: number;
};

export type FindComentariosResult = {
  data: ComentarioRow[];
  count: number;
};

export async function findComentariosByProducto(
  params: FindComentariosParams,
): Promise<FindComentariosResult> {
  const { data, error, count } = await supabase
    .from("comentario")
    .select(COMENTARIO_SELECT, { count: "exact" })
    .eq("producto_id", params.productoId)
    .eq("activo", true)
    .order("created_at", { ascending: false })
    .range(params.from, params.to);

  if (error) throw new Error(error.message);

  return {
    data: (data ?? []) as ComentarioRow[],
    count: count ?? 0,
  };
}
