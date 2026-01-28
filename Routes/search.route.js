import { Router } from "express";   
import { searchBar } from "../controllers/cart.controller.js";

const router = Router();

router.route("/searchBar").get(searchBar);

export default router;