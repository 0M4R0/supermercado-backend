import express from "express";
import cors from "cors";
import helmet from "helmet";

// Routes
import productosRoutes from "./routes/productos.routes.js";
import carritoRoutes from "./routes/carrito.routes.js";
import ubicacionesRoutes from "./routes/ubicaciones.routes.js";
import metodosPagoRoutes from "./routes/metodos-pago.routes.js";
import checkoutRoutes from "./routes/checkout.routes.js";
import pedidosRoutes from "./routes/pedidos.routes.js";
import {
    errorHandler,
    notFoundHandler,
} from "./middlewares/error.middleware.js";

const app = express();

app.use(helmet());

// If production, then use frontend url. If not production, then use these origins
const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL].filter(Boolean) 
    : ["http://localhost:5173"];

const corsOptions = {
    origin: (origin: any, callback: any) => {

        // Block request with no origins in production
        if (!origin) {
            if (process.env.NODE_ENV === 'production') {
                return callback(new Error('Origin not allowed by CORS'));
            }

            // Allow request with no origin in development
            return callback(null, true);
        }

        // Allow request from trusted frontend origins
        if (ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }

        // Rejet everything else
        return callback(new Error('Origin not allowed by CORS'));
    }};

app.use(cors({
    origin: corsOptions.origin,
    credentials: true
}));

app.use(express.json());

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
