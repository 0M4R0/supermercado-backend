import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { apiAuthenticatedLimiter } from "../middlewares/rate-limit";
import {
  getPedidos,
  getPedidoDetails,
} from "../controllers/pedidos.controller";

const router = Router();

router.use(authMiddleware, apiAuthenticatedLimiter);

router.get("/", getPedidos);
router.get("/:codigo", getPedidoDetails);

export default router;
