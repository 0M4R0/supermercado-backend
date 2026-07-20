import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getPedidos } from "../controllers/pedidos.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getPedidos);

export default router;
