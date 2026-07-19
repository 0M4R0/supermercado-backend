import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { postCheckout } from "../controllers/checkout.controller.js";

const router = Router();

router.use(authMiddleware);

router.post("/", postCheckout);

export default router;
