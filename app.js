import express from "express";
import cors from "cors";
import userRoutes from "./Routes/user.route.js";
import productRoutes from "./Routes/product.route.js";
import cartRoutes from "./Routes/cart.route.js";
import searchRoutes from "./Routes/search.route.js";
import orderRoutes from "./Routes/order.route.js";
import compression from "compression";

const app = express();

app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth",userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart",cartRoutes);

app.use("/api/search",searchRoutes);

app.use("/api/orders",orderRoutes);

export default app;