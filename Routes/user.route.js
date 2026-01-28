import { Router } from "express";
import { userRegister ,loginUser , userDetails , addAddress , updateAddress , getAllAddress , deleteAddress} from "../controllers/user.controller.js";
import { verifyJwtToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(userRegister);
router.route("/login").post(loginUser);
router.route("/userDetails").get(verifyJwtToken,userDetails);
router.route("/addAddress").post(verifyJwtToken,addAddress);
router.route("/updateAddress/:addressId").put(verifyJwtToken,updateAddress);
router.route("/getAllAddress").get(verifyJwtToken,getAllAddress);
router.route("/deleteAddress/:addressId").delete(verifyJwtToken,deleteAddress);

export default router;