import { Router } from "express";
import { addWishlists , removeFromWishLists , getUserWishlist , isProductWishlisted} from "../controllers/user.controller.js";
import { verifyJwtToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/addWishLists/:productId").post(verifyJwtToken,addWishlists);
router.route("/removeFromWishLists/:productId").delete(verifyJwtToken,removeFromWishLists);
router.route("/getUsersWishLists").get(verifyJwtToken,getUserWishlist);
router.route("/isProductAlreadyWishlisted/:productId").get(verifyJwtToken,isProductWishlisted);

export default router;