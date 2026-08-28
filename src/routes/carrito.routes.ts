import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { apiAuthenticatedLimiter, apiLimiter } from "../middlewares/rate-limit";
import {
  getCarrito,
  addToCarrito,
  updateCarritoItem,
  removeFromCarrito,
  clearCarrito,
} from "../controllers/carrito.controller";

const router = Router();

router.use(authMiddleware, apiAuthenticatedLimiter);

router.get("/", getCarrito);
router.post("/", apiLimiter, addToCarrito);
router.delete("/", apiLimiter, clearCarrito);
router.put("/:articuloId", apiLimiter, updateCarritoItem);
router.delete("/:articuloId", apiLimiter, removeFromCarrito);

export default router;
