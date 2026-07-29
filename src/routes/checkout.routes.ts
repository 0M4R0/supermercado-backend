import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
    apiAuthenticatedLimiter,
    apiLimiter,
} from "../middlewares/rate-limit.js";
import { postCheckout } from "../controllers/checkout.controller.js";

const router = Router();

router.use(authMiddleware, apiAuthenticatedLimiter);

router.post("/", apiLimiter, postCheckout);

export default router;
