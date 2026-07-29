import { Router } from "express";
import {
    getCategorias,
    getProductoById,
    getProductos,
} from "../controllers/productos.controller.js";
import { catalogLimiter } from "../middlewares/rate-limit.js";

const router = Router();

router.use(catalogLimiter);
router.get("/", getProductos);
router.get("/categorias", getCategorias);
router.get("/:id", getProductoById);

export default router;
