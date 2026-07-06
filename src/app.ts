import express from "express";
import cors from "cors";
import helmet from "helmet";

// Routes
import productosRoutes from "./routes/productos.routes.js";
import carritoRoutes from "./routes/carrito.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/productos", productosRoutes);
app.use("/api/carrito", carritoRoutes);

export default app;
