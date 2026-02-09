import { Router } from "express";
import { createOrder , getOrders , cancelOrder , getAllOrdersAdminProvider , updateOrderStatus} from "../controllers/order.controller.js";
import { createCoupon , applyCoupon , viewCoupon , editCoupon , deleteCoupon , verifyCoupon} from "../controllers/order.controller.js";
import { verifyJwtToken } from "../middlewares/auth.middleware.js";

const orderrouter = Router();

orderrouter.route("/createOrder").post(verifyJwtToken, createOrder);
orderrouter.route("/getOrder").get(verifyJwtToken, getOrders);
orderrouter.route("/cancelOrder/:id").patch(verifyJwtToken, cancelOrder);
orderrouter.route("/getAllOrdersAdminProvider").get(verifyJwtToken,getAllOrdersAdminProvider);
orderrouter.route("/orderStatus/:id").put(verifyJwtToken,updateOrderStatus);

orderrouter.route("/createCoupon").post(verifyJwtToken,createCoupon);
orderrouter.route("/applyCoupon").post(verifyJwtToken,applyCoupon);
orderrouter.route("/viewCoupon").get(verifyJwtToken,viewCoupon);
orderrouter.route("/editCoupon/:id").put(verifyJwtToken,editCoupon);
orderrouter.route("/deleteCoupon/:id").delete(verifyJwtToken,deleteCoupon);
orderrouter.route("/verifyCoupon").post(verifyCoupon);

export default orderrouter;