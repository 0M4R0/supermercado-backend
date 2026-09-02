import { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../config/supabase";

const COMENTARIO_SELECT = `
    id,
    user_id,
    username,
    producto_id,
    description,
    calificacion,
    activo,
    created_at,
    updated_at,
    perfil (nombre)
`;

export type CreateComentarioData = {
  productoId: number;
  username: string;
  description: string;
  activo: boolean;
  calificacion: number;
};

export type UpdateComentarioData = {
  description?: string;
  calificacion?: number;
};

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
  return { data: (data ?? []) as ComentarioRow[], count: count ?? 0 };
}

export async function findComentarioByUserAndProducto(
  supabaseUser: SupabaseClient,
  userId: string,
  productoId: number,
) {
  const { data, error } = await supabaseUser
    .from("comentario")
    .select("id")
    .eq("user_id", userId)
    .eq("producto_id", productoId)
    .eq("activo", true)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
}

export async function findComentarioById(
  supabaseUser: SupabaseClient,
  comentarioId: number,
  userId: string,
) {
  const { data, error } = await supabaseUser
    .from("comentario")
    .select(COMENTARIO_SELECT)
    .eq("id", comentarioId)
    .eq("user_id", userId)
    .eq("activo", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createComentario(
  supabaseUser: SupabaseClient,
  userId: string,
  data: CreateComentarioData,
) {
  const { data: createdData, error } = await supabaseUser
    .from("comentario")
    .insert({
      user_id: userId,
      producto_id: data.productoId,
      username: data.username,
      description: data.description,
      calificacion: data.calificacion,
      activo: data.activo,
    })
    .select(COMENTARIO_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return createdData;
}

export async function updateComentario(
  supabaseUser: SupabaseClient,
  userId: string,
  comentarioId: number,
  data: UpdateComentarioData,
) {
  const { data: updatedData, error } = await supabaseUser
    .from("comentario")
    .update(data)
    .eq("id", comentarioId)
    .eq("user_id", userId)
    .select(COMENTARIO_SELECT);

  if (error) throw new Error(error.message);
  return updatedData;
}

export async function softDeleteComentario(
  supabaseUser: SupabaseClient,
  comentarioId: number,
  userId: string,
) {
  const { data, error } = await supabaseUser
    .from("comentario")
    .update({ activo: false })
    .eq("id", comentarioId)
    .eq("user_id", userId)
    .select(COMENTARIO_SELECT);

  if (error) throw new Error(error.message);
  return data;
}
