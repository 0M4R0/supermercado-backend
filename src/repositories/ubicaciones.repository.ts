import type { SupabaseClient } from "@supabase/supabase-js";

export type UbicacionRow = {
    id: number;
    usuario_id: string;
    direccion: string;
    codigo_postal: number | null;
    ciudad: string;
    provincia: string;
    pais: string;
    por_defecto: boolean;
    activo: boolean;
    direccion_extra: string | null;
};

export type CreateUbicacionData = {
    usuario_id: string;
    direccion: string;
    codigo_postal: number | null;
    ciudad: string;
    provincia: string;
    pais: string;
    por_defecto: boolean;
    direccion_extra: string | null;
};

export type UpdateUbicacionData = {
    direccion?: string;
    codigo_postal?: number | null;
    ciudad?: string;
    provincia?: string;
    pais?: string;
    por_defecto?: boolean;
    direccion_extra?: string | null;
};

const UBICACION_SELECT = `
    id,
    usuario_id,
    direccion,
    codigo_postal,
    ciudad,
    provincia,
    pais,
    por_defecto,
    activo,
    direccion_extra
`;

export async function findLocationsByUser(
    supabaseUser: SupabaseClient,
    userId: string
) {
    return supabaseUser
        .from("ubicacion")
        .select(UBICACION_SELECT)
        .eq("usuario_id", userId)
        .eq("activo", true)
        .order("por_defecto", { ascending: false })
        .order("id", { ascending: true });
}

export async function findLocationById(
    supabaseUser: SupabaseClient,
    userId: string,
    locationId: number
) {
    return supabaseUser
        .from("ubicacion")
        .select(UBICACION_SELECT)
        .eq("id", locationId)
        .eq("usuario_id", userId)
        .eq("activo", true)
        .maybeSingle();
}

export async function insertLocation(
    supabaseUser: SupabaseClient,
    data: CreateUbicacionData
) {
    return supabaseUser
        .from("ubicacion")
        .insert(data)
        .select(UBICACION_SELECT)
        .single();
}

export async function updateLocation(
    supabaseUser: SupabaseClient,
    userId: string,
    locationId: number,
    data: UpdateUbicacionData
) {
    return supabaseUser
        .from("ubicacion")
        .update(data)
        .eq("id", locationId)
        .eq("usuario_id", userId)
        .eq("activo", true)
        .select(UBICACION_SELECT)
        .maybeSingle();
}

// This function sets the other locations to false when one is set as default
export async function clearDefaultLocations(
    supabaseUser: SupabaseClient,
    userId: string,
    exceptId?: number
) {
    let query = supabaseUser
        .from("ubicacion")
        .update({ por_defecto: false })
        .eq("usuario_id", userId)
        .eq("por_defecto", true)
        .eq("activo", true);

    if (exceptId !== undefined) {
        query = query.neq("id", exceptId);
    }

    return await query;
}

// Soft delete a location by changing the activo status
export async function softDeleteLocation(
    supabaseUser: SupabaseClient,
    userId: string,
    locationId: number
) {
    return supabaseUser
        .from("ubicacion")
        .update({ activo: false, por_defecto: false })
        .eq("id", locationId)
        .eq("usuario_id", userId)
        .eq("activo", true)
        .select("id")
        .maybeSingle();
}

export async function countActiveOrdersForLocation(
    supabaseUser: SupabaseClient,
    locationId: number
) {
    const { data, error } = await supabaseUser.rpc(
        "contar_pedidos_activos_por_ubicacion",
        { p_ubicacion_id: locationId }
    );

    if (error) {
        return { count: null, error };
    }

    return { count: Number(data), error: null };
}
