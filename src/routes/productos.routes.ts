import { Router } from "express";
import {
  getCategorias,
  getProductoById,
  getProductos,
} from "../controllers/productos.controller";
import { catalogLimiter, slowLimiter } from "../middlewares/rate-limit";

const router = Router();

router.use(slowLimiter); // 100/minute
router.use(catalogLimiter); // 500/hour

router.get("/", getProductos);
router.get("/categorias", getCategorias);
router.get("/:id", getProductoById);

export default router;
