import type { SupabaseClient } from "@supabase/supabase-js";

export type MetodoPagoCatalogRow = {
  id: number;
  nombre: string;
  activo: boolean;
};

export type UsuarioMetodoPagoRow = {
  id: number;
  usuario_id: string;
  metodo_pago_id: number;
  alias: string | null;
  ultimos_4: string | null;
  token: string | null;
  marca: string | null;
  activo: boolean;
  created_at: string;
};

export type CreateUsuarioMetodoPagoData = {
  usuario_id: string;
  metodo_pago_id: number;
  alias: string | null;
  ultimos_4: string | null;
  token: string | null;
  marca: string | null;
};

export type UpdateUsuarioMetodoPagoData = {
  metodo_pago_id?: number;
  alias?: string | null;
  ultimos_4?: string | null;
  token?: string | null;
  marca?: string | null;
};

const USER_METHOD_SELECT = `
    id,
    usuario_id,
    metodo_pago_id,
    alias,
    ultimos_4,
    token,
    marca,
    activo,
    created_at
`;

export async function findUserPaymentMethods(
  supabaseUser: SupabaseClient,
  userId: string,
) {
  return supabaseUser
    .from("usuario_metodo_pago")
    .select(USER_METHOD_SELECT)
    .eq("usuario_id", userId)
    .eq("activo", true)
    .order("created_at", { ascending: false });
}

export async function findUserPaymentMethodById(
  supabaseUser: SupabaseClient,
  userId: string,
  methodId: number,
) {
  return supabaseUser
    .from("usuario_metodo_pago")
    .select(USER_METHOD_SELECT)
    .eq("id", methodId)
    .eq("usuario_id", userId)
    .eq("activo", true)
    .maybeSingle();
}

export async function findMetodoPagoById(
  supabaseUser: SupabaseClient,
  metodoPagoId: number,
) {
  return supabaseUser
    .from("metodo_pago")
    .select("id, nombre, activo")
    .eq("id", metodoPagoId)
    .maybeSingle();
}

export async function insertUserPaymentMethod(
  supabaseUser: SupabaseClient,
  data: CreateUsuarioMetodoPagoData,
) {
  return supabaseUser
    .from("usuario_metodo_pago")
    .insert(data)
    .select(USER_METHOD_SELECT)
    .single();
}

export async function updateUserPaymentMethod(
  supabaseUser: SupabaseClient,
  userId: string,
  methodId: number,
  data: UpdateUsuarioMetodoPagoData,
) {
  return supabaseUser
    .from("usuario_metodo_pago")
    .update(data)
    .eq("id", methodId)
    .eq("usuario_id", userId)
    .eq("activo", true)
    .select(USER_METHOD_SELECT)
    .maybeSingle();
}

export async function softDeleteUserPaymentMethod(
  supabaseUser: SupabaseClient,
  userId: string,
  methodId: number,
) {
  return supabaseUser
    .from("usuario_metodo_pago")
    .update({ activo: false })
    .eq("id", methodId)
    .eq("usuario_id", userId)
    .eq("activo", true)
    .select("id")
    .maybeSingle();
}
