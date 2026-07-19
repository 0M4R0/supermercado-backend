import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
    getUbicacion,
    getUbicaciones,
    postUbicacion,
    putUbicacion,
    removeUbicacion,
} from "../controllers/ubicaciones.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getUbicaciones);
router.get("/:id", getUbicacion);
router.post("/", postUbicacion);
router.put("/:id", putUbicacion);
router.delete("/:id", removeUbicacion);

export default router;
