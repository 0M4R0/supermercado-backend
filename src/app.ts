import express from "express";
import cors from "cors";
import helmet from "helmet";

// Routes
import productosRoutes from "./routes/productos.routes.js";
import carritoRoutes from "./routes/carrito.routes.js";
import ubicacionesRoutes from "./routes/ubicaciones.routes.js";
import metodosPagoRoutes from "./routes/metodos-pago.routes.js";
import checkoutRoutes from "./routes/checkout.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/productos", productosRoutes);
app.use("/api/carrito", carritoRoutes);
app.use("/api/ubicaciones", ubicacionesRoutes);
app.use("/api/payment-methods", metodosPagoRoutes);
app.use("/api/checkout", checkoutRoutes);

export default app;
