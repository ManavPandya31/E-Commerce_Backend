import { Router } from "express";
import { addProduct, deleteProduct, fetchAllExistedProducts, getSingleProduct, updateProduct ,myProducts , createCatrgory, updateCategory, getCategory, deleteCategory} from "../controllers/product.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwtToken } from "../middlewares/auth.middleware.js";
import { verifyProductOwner } from "../middlewares/productOwner.middleware.js";

const productrouter = Router();

productrouter.route("/addProduct").post(verifyJwtToken,upload.single("productImage"),addProduct);
productrouter.route("/updateProduct/:id").put(verifyJwtToken,verifyProductOwner,upload.single("productImage"), updateProduct);
productrouter.route("/deleteProduct/:id").delete(verifyJwtToken,verifyProductOwner,deleteProduct);
productrouter.route("/showAllProducts").get(fetchAllExistedProducts);
productrouter.route("/findSingleProduct/:id").get(getSingleProduct);
productrouter.route("/my-products").get(verifyJwtToken, myProducts);

productrouter.route("/createCategory").post(verifyJwtToken,createCatrgory);
productrouter.route("/updateCategory/:id").put(verifyJwtToken,updateCategory);
productrouter.route("/getCategory").get(verifyJwtToken,getCategory);
productrouter.route("/deleteCategory/:id").delete(verifyJwtToken,deleteCategory);

export default productrouter;   