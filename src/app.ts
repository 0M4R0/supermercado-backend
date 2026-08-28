import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/config";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import productosRoutes from "./routes/productos.routes";
import carritoRoutes from "./routes/carrito.routes";
import ubicacionesRoutes from "./routes/ubicaciones.routes";
import metodosPagoRoutes from "./routes/metodos-pago.routes";
import checkoutRoutes from "./routes/checkout.routes";
import pedidosRoutes from "./routes/pedidos.routes";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (error: Error | null, allowed?: boolean) => void,
  ) => {
    if (!origin) {
      return callback(null, true);
    }

    if (config.clientUrls.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed by CORS"));
  },
};

app.use(express.json());

app.use(
  cors({
    origin: corsOptions.origin,
    credentials: true,
  }),
);

// Routes
app.use("/api/productos", productosRoutes);
app.use("/api/carrito", carritoRoutes);
app.use("/api/ubicaciones", ubicacionesRoutes);
app.use("/api/payment-methods", metodosPagoRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/pedidos", pedidosRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
