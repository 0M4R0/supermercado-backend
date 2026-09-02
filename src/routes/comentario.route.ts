import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { apiAuthenticatedLimiter } from "../middlewares/rate-limit";
import {
  createComentario,
  updateComentario,
  deleteComentario,
} from "../controllers/comentario.controller";

const router = Router();

router.use(authMiddleware, apiAuthenticatedLimiter);

router.post("/", createComentario);
router.put("/:comentarioId", updateComentario);
router.delete("/:comentarioId", deleteComentario);

export const comentarioRouter = router;
