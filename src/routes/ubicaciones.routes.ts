import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
    apiAuthenticatedLimiter,
    apiLimiter,
} from "../middlewares/rate-limit.js";
import {
    getUbicacion,
    getUbicaciones,
    postUbicacion,
    putUbicacion,
    removeUbicacion,
} from "../controllers/ubicaciones.controller.js";

const router = Router();

router.use(authMiddleware, apiAuthenticatedLimiter);

router.get("/", getUbicaciones);
router.get("/:id", getUbicacion);
router.post("/", apiLimiter, postUbicacion);
router.put("/:id", apiLimiter, putUbicacion);
router.delete("/:id", apiLimiter, removeUbicacion);

export default router;
