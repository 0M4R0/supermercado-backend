import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { apiAuthenticatedLimiter, apiLimiter } from "../middlewares/rate-limit";
import { postCheckout } from "../controllers/checkout.controller";

const router = Router();

router.use(authMiddleware, apiAuthenticatedLimiter);

router.post("/", apiLimiter, postCheckout);

export default router;
