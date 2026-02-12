import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { apiError } from "../Utils/apiError.js";
import { apiResponse } from "../Utils/apiResponse.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { Category } from "../models/category.model.js";

const addToCart = asyncHandler(async (req, res) => {

  const userId = req.user._id;
  const { productId, quantity } = req.body;

  if (!productId || !quantity) {
    throw new apiError(400, "All fields are required");
  }

  const product = await Product.findById(productId).select("price finalPrice");
  if (!product) {
    throw new apiError(404, "Product not found");
  }

  const cart = await Cart.findOneAndUpdate(
    { user: userId, "items.product": productId },
    {
       $inc: {
        "items.$.quantity": quantity,
        totalAmount: product.finalPrice * quantity
      },
        $set: {
        "items.$.finalPrice": product.finalPrice,
        "items.$.price": product.price
      }
      
    },
    { new: true }
  );

  if (cart) {
    return res.status(200).json(
      new apiResponse(200, cart, "Product quantity updated")
    );
  }

  const newCart = await Cart.findOneAndUpdate(
    { user: userId },
    {
      $push: {
        items: {
          product: productId,
          quantity,
          price: product.price,
          finalPrice: product.finalPrice
        }
      },
      $inc: {
        totalAmount: product.finalPrice * quantity
      }
    },
    { upsert: true, new: true }
  );

  return res.status(200).json(
    new apiResponse(200, newCart, "Product added to cart")
  );
});

const updateCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId, quantity } = req.body;

  if (!productId || quantity == null) {
    throw new apiError(400, "Fill required details");
  }

  if (quantity < 1) {
    throw new apiError(400, "Quantity must be >= 1");
  }

  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new apiError(404, "Cart not found");
  }

  const item = cart.items.find(
    (i) => i.product.toString() === productId
  );

  if (!item) {
    throw new apiError(404, "Product not found in cart");
  }

  item.quantity = quantity;

  cart.totalAmount = cart.items.reduce(
    (sum, i) => sum + i.finalPrice * i.quantity,
    0
  );

  await cart.save();

  return res
    .status(200)
    .json(new apiResponse(200, cart, "Cart updated successfully"));
});

const deleteFromCart = asyncHandler(async (req, res) => {

  const userId = req.user._id;
  const { productId } = req.body;

  if (!productId) {
    throw new apiError(400, "ProductId is required");
  }

  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new apiError(404, "Cart not found");
  }

  cart.items = cart.items.filter(
    item => item.product.toString() !== productId
  );

  cart.totalAmount = cart.items.reduce(
    (total, item) => total + item.finalPrice * item.quantity,
    0
  );

  await cart.save();
  
  return res.status(200)
            .json(new apiResponse(200, cart, "Item removed successfully")
  );
});

const displayAllCartItems = asyncHandler(async(req,res)=>{

    const userId = req.user._id;

    const cart = await Cart.findOne({ user : userId }).populate("items.product", "name price finalPrice productImage")

        if(!cart){
            throw new apiError(401,"Cart Is Empty..");
        }

        return res.status(200)
                  .json(new apiResponse(200 , cart , "All Cart Itrems.."));
});

// const searchBar = asyncHandler(async (req, res) => {
  
//   const { q } = req.query;

//   if (!q || q.trim() === "") {
//     return res.status(200).json(
//       new apiResponse(200, { categories: [], products: [] }, "Empty query")
//     );
//   }

//   const searchText = q.trim();

//   const categories = await Category.find({
//     name: { $regex: searchText, $options: "i" }
//   });

//   let products = [];

//   if (categories.length > 0) {
//     const categoryIds = categories.map(cat => cat._id);

//     products = await Product.find({
//       category: { $in: categoryIds }
//     })
//       .populate("category", "name")
//       .select("name productImage price category");
//   } else {
//     products = await Product.find({
//       $or: [
//         { name: { $regex: searchText, $options: "i" } },
//         { description: { $regex: searchText, $options: "i" } }
//       ]
//     })
//       .populate("category", "name")
//       .select("name productImage price category");
//   }

//   return res.status(200).json(
//     new apiResponse(200, {
//       categories: categories.map(cat => ({
//         _id: cat._id,
//         name: cat.name
//       })),
//       products: products.map(prod => ({
//         _id: prod._id,
//         name: prod.name,
//         categoryName: prod.category?.name,
//         image: prod.productImage
//       }))
//     }, "Search results")
//   );
// });

const searchBar = asyncHandler(async (req, res) => {
  
  const { q } = req.query;

  if (!q || q.trim() === "") {
    return res.status(200).json(
      new apiResponse(200, { categories: [], products: [] }, "Empty query")
    );
  }

  const searchText = q.trim();

  const categories = await Category.find({
    name: { $regex: searchText, $options: "i" }
  });

  const categoryIds = categories.map(cat => cat._id);

  const products = await Product.find({
    $or: [
      { name: { $regex: searchText, $options: "i" } },
      { description: { $regex: searchText, $options: "i" } },
      { category: { $in: categoryIds } }  
    ]
  })
    .populate("category", "name")
    .select("name productImage price category");

  return res.status(200).json(
    new apiResponse(200, {
      categories: categories.map(cat => ({ _id: cat._id, name: cat.name })),
      products: products.map(prod => ({
        _id: prod._id,
        name: prod.name,
        categoryName: prod.category?.name,
        image: prod.productImage
      }))
    }, "Search results")
  );
});

export { addToCart , updateCart , deleteFromCart , displayAllCartItems , searchBar};