import type { SupabaseClient } from "@supabase/supabase-js";
import {
    clearDefaultLocations,
    countActiveOrdersForLocation,
    findLocationById,
    findLocationsByUser,
    insertLocation,
    softDeleteLocation,
    updateLocation,
    type UbicacionRow,
} from "../repositories/ubicaciones.repository.js";

export type ServiceResult<T> =
    | { success: true; status: number; data: T }
    | { success: false; status: number; error: string };

const DEFAULT_PAIS = "República Dominicana";
const MAX_DIRECCION = 255;
const MAX_CIUDAD = 100;
const MAX_PROVINCIA = 100;
const MAX_PAIS = 100;
const MAX_DIRECCION_EXTRA = 150;

type ValidatedCreate = {
    direccion: string;
    codigo_postal: number | null;
    ciudad: string;
    provincia: string;
    pais: string;
    por_defecto: boolean;
    direccion_extra: string | null;
};

type ValidatedUpdate = {
    direccion?: string;
    codigo_postal?: number | null;
    ciudad?: string;
    provincia?: string;
    pais?: string;
    por_defecto?: boolean;
    direccion_extra?: string | null;
};

function parseOptionalString(
    value: unknown,
    field: string,
    maxLen: number,
    required: boolean
): { value: string | null } | { error: string } {
    if (value === undefined || value === null || value === "") {
        if (required) return { error: `${field} es requerido` };
        return { value: null };
    }
    if (typeof value !== "string") {
        return { error: `${field} debe ser texto` };
    }
    const trimmed = value.trim();
    if (!trimmed) {
        if (required) return { error: `${field} es requerido` };
        return { value: null };
    }
    if (trimmed.length > maxLen) {
        return { error: `${field} no puede exceder ${maxLen} caracteres` };
    }
    return { value: trimmed };
}

function parseCodigoPostal(
    value: unknown
): { value: number | null } | { error: string } {
    if (value === undefined || value === null || value === "") {
        return { value: null };
    }
    const n = typeof value === "number" ? value : parseInt(String(value), 10);
    if (!Number.isInteger(n) || n < 0) {
        return { error: "codigo_postal debe ser un número entero válido" };
    }
    return { value: n };
}

function parsePorDefecto(
    value: unknown,
    fallback: boolean
): { value: boolean } | { error: string } {
    if (value === undefined || value === null || value === "") {
        return { value: fallback };
    }
    if (typeof value === "boolean") return { value };
    if (value === "true" || value === 1 || value === "1") return { value: true };
    if (value === "false" || value === 0 || value === "0") return { value: false };
    return { error: "por_defecto debe ser booleano" };
}

function validateCreateBody(body: Record<string, unknown>): ServiceResult<ValidatedCreate> {
    const direccion = parseOptionalString(body.direccion, "direccion", MAX_DIRECCION, true);
    if ("error" in direccion) {
        return { success: false, status: 400, error: direccion.error };
    }

    const ciudad = parseOptionalString(body.ciudad, "ciudad", MAX_CIUDAD, true);
    if ("error" in ciudad) {
        return { success: false, status: 400, error: ciudad.error };
    }

    const provincia = parseOptionalString(body.provincia, "provincia", MAX_PROVINCIA, true);
    if ("error" in provincia) {
        return { success: false, status: 400, error: provincia.error };
    }

    const paisRaw =
        body.pais === undefined || body.pais === null || body.pais === ""
            ? DEFAULT_PAIS
            : body.pais;
    const pais = parseOptionalString(paisRaw, "pais", MAX_PAIS, true);
    if ("error" in pais) {
        return { success: false, status: 400, error: pais.error };
    }

    const codigoPostal = parseCodigoPostal(body.codigo_postal);
    if ("error" in codigoPostal) {
        return { success: false, status: 400, error: codigoPostal.error };
    }

    const direccionExtra = parseOptionalString(
        body.direccion_extra,
        "direccion_extra",
        MAX_DIRECCION_EXTRA,
        false
    );
    if ("error" in direccionExtra) {
        return { success: false, status: 400, error: direccionExtra.error };
    }

    const porDefecto = parsePorDefecto(body.por_defecto, false);
    if ("error" in porDefecto) {
        return { success: false, status: 400, error: porDefecto.error };
    }

    return {
        success: true,
        status: 200,
        data: {
            direccion: direccion.value!,
            ciudad: ciudad.value!,
            provincia: provincia.value!,
            pais: pais.value!,
            codigo_postal: codigoPostal.value,
            direccion_extra: direccionExtra.value,
            por_defecto: porDefecto.value,
        },
    };
}

function validateUpdateBody(body: Record<string, unknown>): ServiceResult<ValidatedUpdate> {
    const data: ValidatedUpdate = {};
    const hasAny =
        body.direccion !== undefined ||
        body.ciudad !== undefined ||
        body.provincia !== undefined ||
        body.pais !== undefined ||
        body.codigo_postal !== undefined ||
        body.direccion_extra !== undefined ||
        body.por_defecto !== undefined;

    if (!hasAny) {
        return {
            success: false,
            status: 400,
            error: "Debe enviar al menos un campo para actualizar",
        };
    }

    if (body.direccion !== undefined) {
        const direccion = parseOptionalString(body.direccion, "direccion", MAX_DIRECCION, true);
        if ("error" in direccion) {
            return { success: false, status: 400, error: direccion.error };
        }
        data.direccion = direccion.value!;
    }

    if (body.ciudad !== undefined) {
        const ciudad = parseOptionalString(body.ciudad, "ciudad", MAX_CIUDAD, true);
        if ("error" in ciudad) {
            return { success: false, status: 400, error: ciudad.error };
        }
        data.ciudad = ciudad.value!;
    }

    if (body.provincia !== undefined) {
        const provincia = parseOptionalString(
            body.provincia,
            "provincia",
            MAX_PROVINCIA,
            true
        );
        if ("error" in provincia) {
            return { success: false, status: 400, error: provincia.error };
        }
        data.provincia = provincia.value!;
    }

    if (body.pais !== undefined) {
        const pais = parseOptionalString(body.pais, "pais", MAX_PAIS, true);
        if ("error" in pais) {
            return { success: false, status: 400, error: pais.error };
        }
        data.pais = pais.value!;
    }

    if (body.codigo_postal !== undefined) {
        const codigoPostal = parseCodigoPostal(body.codigo_postal);
        if ("error" in codigoPostal) {
            return { success: false, status: 400, error: codigoPostal.error };
        }
        data.codigo_postal = codigoPostal.value;
    }

    if (body.direccion_extra !== undefined) {
        const direccionExtra = parseOptionalString(
            body.direccion_extra,
            "direccion_extra",
            MAX_DIRECCION_EXTRA,
            false
        );
        if ("error" in direccionExtra) {
            return { success: false, status: 400, error: direccionExtra.error };
        }
        data.direccion_extra = direccionExtra.value;
    }

    if (body.por_defecto !== undefined) {
        const porDefecto = parsePorDefecto(body.por_defecto, false);
        if ("error" in porDefecto) {
            return { success: false, status: 400, error: porDefecto.error };
        }
        data.por_defecto = porDefecto.value;
    }

    return { success: true, status: 200, data };
}

function parseLocationId(raw: string): ServiceResult<number> {
    const id = parseInt(raw, 10);
    if (isNaN(id) || id < 1) {
        return { success: false, status: 400, error: "ID de ubicación inválido" };
    }
    return { success: true, status: 200, data: id };
}

export async function listUbicaciones(
    supabaseUser: SupabaseClient,
    userId: string
): Promise<ServiceResult<UbicacionRow[]>> {
    const { data, error } = await findLocationsByUser(supabaseUser, userId);
    if (error) {
        return { success: false, status: 500, error: error.message };
    }
    return { success: true, status: 200, data: (data ?? []) as UbicacionRow[] };
}

export async function getUbicacionById(
    supabaseUser: SupabaseClient,
    userId: string,
    locationIdRaw: string
): Promise<ServiceResult<UbicacionRow>> {
    const idResult = parseLocationId(locationIdRaw);
    if (!idResult.success) return idResult;

    const { data, error } = await findLocationById(
        supabaseUser,
        userId,
        idResult.data
    );
    if (error) {
        return { success: false, status: 500, error: error.message };
    }
    if (!data) {
        return { success: false, status: 404, error: "Ubicación no encontrada" };
    }
    return { success: true, status: 200, data: data as UbicacionRow };
}

export async function createUbicacion(
    supabaseUser: SupabaseClient,
    userId: string,
    body: Record<string, unknown>
): Promise<ServiceResult<UbicacionRow>> {
    const validated = validateCreateBody(body);
    if (!validated.success) return validated;

    const { data: existing, error: listError } = await findLocationsByUser(
        supabaseUser,
        userId
    );
    if (listError) {
        return { success: false, status: 500, error: listError.message };
    }

    const isFirst = !(existing ?? []).length;
    const porDefecto = isFirst ? true : validated.data.por_defecto;

    if (porDefecto) {
        const { error: clearError } = await clearDefaultLocations(
            supabaseUser,
            userId
        );
        if (clearError) {
            return { success: false, status: 500, error: clearError.message };
        }
    }

    const { data, error } = await insertLocation(supabaseUser, {
        usuario_id: userId,
        ...validated.data,
        por_defecto: porDefecto,
    });

    if (error) {
        return { success: false, status: 500, error: error.message };
    }

    return { success: true, status: 201, data: data as UbicacionRow };
}

export async function updateUbicacion(
    supabaseUser: SupabaseClient,
    userId: string,
    locationIdRaw: string,
    body: Record<string, unknown>
): Promise<ServiceResult<UbicacionRow>> {
    const idResult = parseLocationId(locationIdRaw);
    if (!idResult.success) return idResult;

    const validated = validateUpdateBody(body);
    if (!validated.success) return validated;

    const { data: current, error: findError } = await findLocationById(
        supabaseUser,
        userId,
        idResult.data
    );
    if (findError) {
        return { success: false, status: 500, error: findError.message };
    }
    if (!current) {
        return { success: false, status: 404, error: "Ubicación no encontrada" };
    }

    if (validated.data.por_defecto === true) {
        const { error: clearError } = await clearDefaultLocations(
            supabaseUser,
            userId,
            idResult.data
        );
        if (clearError) {
            return { success: false, status: 500, error: clearError.message };
        }
    }

    const { data, error } = await updateLocation(
        supabaseUser,
        userId,
        idResult.data,
        validated.data
    );

    if (error) {
        return { success: false, status: 500, error: error.message };
    }
    if (!data) {
        return { success: false, status: 404, error: "Ubicación no encontrada" };
    }

    return { success: true, status: 200, data: data as UbicacionRow };
}

export async function deleteUbicacion(
    supabaseUser: SupabaseClient,
    userId: string,
    locationIdRaw: string
): Promise<ServiceResult<{ message: string; id: number }>> {
    const idResult = parseLocationId(locationIdRaw);
    if (!idResult.success) return idResult;

    const { data: current, error: findError } = await findLocationById(
        supabaseUser,
        userId,
        idResult.data
    );
    if (findError) {
        return { success: false, status: 500, error: findError.message };
    }
    if (!current) {
        return { success: false, status: 404, error: "Ubicación no encontrada" };
    }

    const { count, error: ordersError } = await countActiveOrdersForLocation(
        supabaseUser,
        idResult.data
    );
    if (ordersError) {
        return { success: false, status: 500, error: ordersError.message };
    }
    if ((count ?? 0) > 0) {
        return {
            success: false,
            status: 409,
            error: "No se puede eliminar la ubicación porque tiene un pedido activo",
        };
    }

    const { data, error } = await softDeleteLocation(
        supabaseUser,
        userId,
        idResult.data
    );
    if (error) {
        return { success: false, status: 500, error: error.message };
    }
    if (!data) {
        return { success: false, status: 404, error: "Ubicación no encontrada" };
    }

    return {
        success: true,
        status: 200,
        data: { message: "Ubicación eliminada", id: idResult.data },
    };
}
