import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
    getCarrito,
    addToCarrito,
    updateCarritoItem,
    removeFromCarrito,
    clearCarrito,
} from "../controllers/carrito.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getCarrito);
router.post("/", addToCarrito);
router.delete("/", clearCarrito);
router.put("/:articuloId", updateCarritoItem);
router.delete("/:articuloId", removeFromCarrito);

export default router;
