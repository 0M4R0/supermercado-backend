import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
    getPaymentMethods,
    postPaymentMethod,
    putPaymentMethod,
    removePaymentMethod,
} from "../controllers/metodos-pago.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getPaymentMethods);
router.post("/", postPaymentMethod);
router.put("/:id", putPaymentMethod);
router.delete("/:id", removePaymentMethod);

export default router;
