import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { apiAuthenticatedLimiter } from "../middlewares/rate-limit.js";
import { getPedidos } from "../controllers/pedidos.controller.js";

const router = Router();

router.use(authMiddleware, apiAuthenticatedLimiter);

router.get("/", getPedidos);

export default router;
