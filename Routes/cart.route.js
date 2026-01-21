import { Router } from "express";
import { verifyJwtToken } from "../middlewares/auth.middleware.js";
import { addToCart, deleteFromCart, displayAllCartItems, updateCart } from "../controllers/cart.controller.js";

const cartRouter = Router();

cartRouter.route("/addCartItems").post(verifyJwtToken,addToCart);
cartRouter.route("/updateCartItems").put(verifyJwtToken,updateCart);
cartRouter.route("/deleteCartItems").delete(verifyJwtToken,deleteFromCart);
cartRouter.route("/readAllItems").get(verifyJwtToken,displayAllCartItems);

export default cartRouter;