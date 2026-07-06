import { Router } from "express";
import {
    getCategorias,
    getProductoById,
    getProductos,
} from "../controllers/productos.controller.js";

const router = Router();

router.get("/", getProductos);
router.get("/categorias", getCategorias);
router.get("/:id", getProductoById);

export default router;
