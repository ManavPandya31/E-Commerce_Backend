import express from "express";
import cors from "cors";
import userRoutes from "./Routes/user.route.js";
import productRoutes from "./Routes/product.route.js";
import cartRoutes from "./Routes/cart.route.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth",userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart",cartRoutes);

export default app;