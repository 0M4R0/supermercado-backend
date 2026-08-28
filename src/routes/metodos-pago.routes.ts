import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { apiAuthenticatedLimiter, apiLimiter } from "../middlewares/rate-limit";
import {
  getPaymentMethods,
  postPaymentMethod,
  putPaymentMethod,
  removePaymentMethod,
} from "../controllers/metodos-pago.controller";

const router = Router();

router.use(authMiddleware, apiAuthenticatedLimiter);

router.get("/", getPaymentMethods);
router.post("/", apiLimiter, postPaymentMethod);
router.put("/:id", apiLimiter, putPaymentMethod);
router.delete("/:id", apiLimiter, removePaymentMethod);

export default router;
