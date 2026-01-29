import { Router } from "express";
import { createOrder , getOrders , cancelOrder , getAllOrdersAdminProvider , updateOrderStatus} from "../controllers/order.controller.js";
import { verifyJwtToken } from "../middlewares/auth.middleware.js";

const orderrouter = Router();

orderrouter.route("/createOrder").post(verifyJwtToken, createOrder);
orderrouter.route("/getOrder").get(verifyJwtToken, getOrders);
orderrouter.route("/cancelOrder/:id").patch(verifyJwtToken, cancelOrder);
orderrouter.route("/getAllOrdersAdminProvider").get(verifyJwtToken,getAllOrdersAdminProvider);
orderrouter.route("/orderStatus/:id").put(verifyJwtToken,updateOrderStatus);

export default orderrouter;