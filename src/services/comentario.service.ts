import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createComentario,
  findComentarioById,
  findComentarioByUserAndProducto,
  softDeleteComentario,
  updateComentario,
  type UpdateComentarioData,
} from "../repositories/comentario.repository";
import type {
  Comentario,
  ValidatedComentarioData,
} from "../dtos/comentario.dto";

export async function create_comentario(
  supabase: SupabaseClient,
  userId: string,
  data: ValidatedComentarioData,
) {
  // We need to verify if the user has already commented in that product
  const existing = await findComentarioByUserAndProducto(
    supabase,
    userId,
    data.productoId,
  );

  if (existing) {
    return {
      success: false as const,
      status: 409,
      error: "User has already commented on this product",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const username =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Usuario";

  // If not, we create the comment
  const comentario = await createComentario(supabase, userId, {
    productoId: data.productoId,
    username,
    description: data.description,
    activo: true,
    calificacion: data.calificacion,
  });

  return {
    success: true as const,
    status: 201,
    data: comentario,
  };
}

function canEdit(existing: Comentario) {
  const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
  const createdAt = new Date(existing.created_at).getTime();
  const age = Date.now() - createdAt;

  return age >= 0 && age < FIFTEEN_MINUTES_MS;
}

export async function update_comentario(
  supabase: SupabaseClient,
  userId: string,
  comentarioId: number,
  data: UpdateComentarioData,
) {
  // Find the comment to update_comentario
  const existing = await findComentarioById(supabase, comentarioId, userId);
  if (!existing) {
    return {
      success: false as const,
      status: 404,
      error: "Comentario not found",
    };
  }

  // If the comment was created within the last 15 minutes, update it; otherwise, return an error
  if (!canEdit(existing)) {
    return {
      success: false as const,
      status: 403,
      error: "Comentario cannot be edited",
    };
  }

  // update the comment
  const updated = await updateComentario(supabase, userId, comentarioId, data);
  if (!updated) {
    return {
      success: false as const,
      status: 500,
      error: "Failed to update comentario",
    };
  }

  return {
    success: true as const,
    status: 200,
    data: updated,
  };
}

export async function delete_comentario(
  supabase: SupabaseClient,
  userId: string,
  comentarioId: number,
) {
  // Find the comment to delete
  const existing = await findComentarioById(supabase, comentarioId, userId);

  if (!existing) {
    return {
      success: false as const,
      status: 404,
      error: "Comentario not found",
    };
  }

  // Delete the comment
  const comentario = await softDeleteComentario(supabase, comentarioId, userId);

  if (!comentario || comentario.length === 0) {
    return {
      success: false as const,
      status: 500,
      error: "Failed to delete comentario",
    };
  }

  // Return true if the comment was deleted
  return {
    success: true as const,
    status: 200,
    data: {
      message: "Comentario deleted successfully",
    },
  };
}
