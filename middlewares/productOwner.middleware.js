import {Product} from "../models/product.model.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { apiError } from "../Utils/apiError.js";    
import { apiResponse } from "../Utils/apiResponse.js";

const verifyProductOwner = asyncHandler(async (req, res, next) => {

  try {

    const productId = req.params.id;
    const loggedInUserId = req.user._id;
    const userRole = req.user.role;

    const product = await Product.findById(productId);
    console.log("Product Is :-", product);

    if (!product) {
      throw new apiError(404, "Product Not Found");
    }

    if (userRole !== "admin" && product.userId.toString() !== loggedInUserId.toString()) {
      throw new apiError(401, "You Are Not Authorized..");
    }

    req.product = product;
    next();

  } catch (error) {
    return res.status(401)
              .json(new apiResponse(401, "Invalid or Unauthorized"));
  }
});

export { verifyProductOwner };