import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { apiError } from "../Utils/apiError.js";
import { apiResponse } from "../Utils/apiResponse.js";
import { asyncHandler } from "../Utils/asyncHandler.js";

// const addToCart = asyncHandler(async(req,res)=>{

//     const userId = req.user._id;
//     //console.log("Req User :-", req.user);

//     const { productId , quantity } = req.body;

//     if( !productId || !quantity ){
//         throw new apiError(400,"All Fields Are Required..");
//     }

//     const product = await Product.findById(productId);
//     //console.log("Product Is :- ",product);

//     if(!product){
//         throw new apiError(404,"Product Not Found..");
//     }

//     let cart =  await Cart.findOne({
//         user : userId,
//     });
//     //console.log("Cart",cart);

//     //Add Items Into The Cart..
//     if(!cart){
//        cart = await Cart.create({
//             user : userId,
//             items: [{ product : productId, 
//                       quantity,
//                       price : product.price }],
//             totalAmount : product.price * quantity,
//        });
//     }

//     //Check If The User Add Items , That Already Existis In The Cart Then It Will Not 
//     //Again That Item Into The Cart , Instead Of Add Item Go To The Cart And Increase The 
//     //Quantity Of that Items..Find That Item In Cart Using Index Number..

//     const itemIndex = cart.items.findIndex(
//         item => item.product.toString() === productId,
//     );
//     //console.log("Item Founded At Index :- ",itemIndex);
    
//     if(itemIndex > -1){
//         cart.items[itemIndex].quantity += quantity;//Increse If Already Product Existed On Cart
//     }else{

//     cart.items.push({
//         product : productId,
//         quantity,
//         price : product.price,
//     });
// }

//     cart.totalAmount = cart.items.reduce(
//          (total, item) => total + item.price * item.quantity,
//             0 //Initial Value Means Now Total = 0,
//     );

//     const cartSavedItems = await cart.save();
//     //console.log("All Cart Items :- ", cartSavedItems);

//     return res.status(200)
//               .json(new apiResponse(200 , cart , "Product Add Into The Cart Sucessfully.."));

// });

const addToCart = asyncHandler(async (req, res) => {

  const userId = req.user._id;
  const { productId, quantity } = req.body;

  if (!productId || !quantity) {
    throw new apiError(400, "All fields are required");
  }

  const product = await Product.findById(productId).select("price");
  if (!product) {
    throw new apiError(404, "Product not found");
  }

  const cart = await Cart.findOneAndUpdate(
    { user: userId, "items.product": productId },
    {
      $inc: {
        "items.$.quantity": quantity,
        totalAmount: product.price * quantity
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
          price: product.price
        }
      },
      $inc: {
        totalAmount: product.price * quantity
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

  if (!productId || !quantity) {
    throw new apiError(400, "Fill Required Details");
  }

  if (quantity < 1) {
    throw new apiError(400, "Quantity must be >= 1");
  }

  const cart = await Cart.findOneAndUpdate(
    {
      user: userId,
      "items.product": productId,
    },
    {
      $set: {
        "items.$.quantity": quantity,
        "items.$.itemTotal": { $multiply: ["$items.$.price", quantity] }
      }
    },
    { new: true }
  );

  if (!cart) {
    throw new apiError(404, "Product not found in cart");
  }

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
    (total, item) => total + item.price * item.quantity,
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

const searchBar = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    throw new apiError(200, "Search Query Is Empty..");
  }

  // Handle plural by removing trailing 's' optionally
  const normalizedQuery = q.endsWith("s") ? q.slice(0, -1) : q;
  const searchRegex = new RegExp(normalizedQuery, "i");

  const priceQuery = !isNaN(q) ? { price: Number(q) } : null;

  const conditions = [
    { name: { $regex: searchRegex } },
    { description: { $regex: searchRegex } },
    { "categories.name": { $regex: searchRegex } },
  ];

  if (priceQuery) conditions.push(priceQuery);

  const products = await Product.find({
    $or: conditions,
  })
    .select("name price categories")
    .limit(20);

  return res.status(200).json(new apiResponse(200, products, "Search Results.."));
});

export { addToCart , updateCart , deleteFromCart , displayAllCartItems , searchBar};