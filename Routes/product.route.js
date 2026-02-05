import { Router } from "express";
import { addProduct, deleteProduct, fetchAllExistedProducts, getSingleProduct, updateProduct ,myProducts , createCatrgory, updateCategory, getCategory, deleteCategory , getRelatedProducts , createCombo} from "../controllers/product.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwtToken } from "../middlewares/auth.middleware.js";
import { verifyProductOwner } from "../middlewares/productOwner.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const productrouter = Router();

productrouter.route("/addProduct").post(verifyJwtToken,upload.single("productImage"),addProduct);
productrouter.route("/updateProduct/:id").put(verifyJwtToken,verifyProductOwner,upload.single("productImage"), updateProduct);
productrouter.route("/deleteProduct/:id").delete(verifyJwtToken,verifyProductOwner,deleteProduct);
productrouter.route("/showAllProducts").get(fetchAllExistedProducts);
productrouter.route("/findSingleProduct/:id").get(getSingleProduct);
productrouter.route("/my-products").get(verifyJwtToken, myProducts);
productrouter.route("/related-products/related/:id").get(getRelatedProducts);
// productrouter.route("/getProductWithProvidersDetails/:id").get(verifyJwtToken, getProductWithProviderDetails);
productrouter.route("/createCombo").post(verifyJwtToken,createCombo);

productrouter.route("/createCategory").post(verifyJwtToken,verifyAdmin,createCatrgory);
productrouter.route("/updateCategory/:id").put(verifyJwtToken,verifyAdmin,updateCategory);
productrouter.route("/getCategory").get(getCategory);
productrouter.route("/deleteCategory/:id").delete(verifyJwtToken,verifyAdmin,deleteCategory);

export default productrouter;   