import { Router } from "express";
import { userRegister ,loginUser , userDetails , addAddress , updateAddress ,
getAllAddress , deleteAddress , verifyEmail , forgotPassword , resetPassword , verifyOtp
, getAllUsers , getUsersByRole , getAdminDashboardStats} from "../controllers/user.controller.js";
import { verifyJwtToken } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

router.post("/register", userRegister);
router.get("/verifyEmail/:token", verifyEmail);
router.route("/login").post(loginUser);
router.route("/getAllUsers").get(verifyJwtToken,verifyAdmin,getAllUsers);
// router.route("/getAllCustomers").get(verifyJwtToken,verifyAdmin,getAllCustomers);
// router.route("/getAllProviders").get(verifyJwtToken,verifyAdmin,getAllProviders);
router.route("/getusersByRole").get(verifyJwtToken,verifyAdmin,getUsersByRole);
router.route("/getStatusDashboard").get(verifyJwtToken,verifyAdmin,getAdminDashboardStats);

router.route("/userDetails").get(verifyJwtToken,userDetails);
router.route("/addAddress").post(verifyJwtToken,addAddress);
router.route("/updateAddress/:addressId").put(verifyJwtToken,updateAddress);
router.route("/getAllAddress").get(verifyJwtToken,getAllAddress);
router.route("/deleteAddress/:addressId").delete(verifyJwtToken,deleteAddress);

router.route("/verifyEmail/:token").get(verifyEmail);
router.route("/forgotPassword").post(forgotPassword);
router.route("/resetPassword").post(resetPassword);
router.route("/verifyOTP").post(verifyOtp);

export default router;