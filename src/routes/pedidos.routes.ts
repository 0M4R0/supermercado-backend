import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { apiAuthenticatedLimiter } from "../middlewares/rate-limit.js";
import { getPedidos, getPedidoDetails } from "../controllers/pedidos.controller.js";

const router = Router();

router.use(authMiddleware, apiAuthenticatedLimiter);

router.get("/", getPedidos);
router.get("/:codigo", getPedidoDetails);

export default router;
