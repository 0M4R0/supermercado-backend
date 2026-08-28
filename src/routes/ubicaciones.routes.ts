import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { apiAuthenticatedLimiter, apiLimiter } from "../middlewares/rate-limit";
import {
  getUbicacion,
  getUbicaciones,
  postUbicacion,
  putUbicacion,
  removeUbicacion,
} from "../controllers/ubicaciones.controller";

const router = Router();

router.use(authMiddleware, apiAuthenticatedLimiter);

router.get("/", getUbicaciones);
router.get("/:id", getUbicacion);
router.post("/", apiLimiter, postUbicacion);
router.put("/:id", apiLimiter, putUbicacion);
router.delete("/:id", apiLimiter, removeUbicacion);

export default router;
