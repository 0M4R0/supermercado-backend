import type { Request, Response, NextFunction } from "express";
import { supabase, createSupabaseUserClient } from "../config/supabase";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  const token = authHeader.slice(7);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }

  req.user = data.user;
  req.userToken = token;
  req.supabaseUser = createSupabaseUserClient(token);
  next();
};
