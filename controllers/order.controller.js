import { asyncHandler } from "../Utils/asyncHandler.js";
import { apiResponse } from "../Utils/apiResponse.js";
import { apiError } from "../Utils/apiError.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";

const createOrder = asyncHandler(async(req,res)=>{

    const { products , addressId } = req.body;

    if(!products || products.length === 0){
        throw new apiError(400,"Add Product For Order..!");
    }

    const user = await User.findById(req.user._id);
    const address = user.addresses.id(addressId);

    if(!address){
        throw new apiError(400,"Address Is Not Found..!");
    }

    address.addressType = address.addressType?.toUpperCase();

    let totalAmount = 0;

    for (let item of products) {
        const product = await Product.findById(item.product);
        if (!product) throw new apiError(404, `Product with id ${item.product} not found.`);
        if (product.stock < item.quantity) throw new apiError(400, `Not enough stock for product ${product.name}.`);
        totalAmount += product.finalPrice * item.quantity;
    }

     const order = await Order.create({
        user: req.user._id,
        products: products.map(p => ({
            product: p.product,
            quantity: p.quantity,
            price: p.price
        })),
        address: address,
        totalAmount,
    });

    return res.status(200)
              .json(new apiResponse(200,order,"Order Created Sucessfully.."));
});

const getOrders = asyncHandler(async(req,res)=>{

    const orders = await Order.find({ user: req.user._id })
    .populate("products.product", "name")
    .sort({ createdAt: -1 });

    return res.status(200)
              .json(new apiResponse(200, orders,"Orders Fetch Sucessfully.."))
});

const cancelOrder = asyncHandler(async(req,res)=>{
 
    const { id } = req.params;
    console.log("Order ID:", id);
    console.log("Token User ID:", req.user._id); 

    const order = await Order.findOne({ _id: id, user: req.user._id });
    console.log("Order From DB:", order);   

    if(!order){
        throw new apiError(404,"Order Not found");
    }

     if (order.status === "Delivered") {
        throw new apiError(400, "Delivered order cannot be cancelled");
    }

    order.status = "Cancelled";
    await order.save();

    return res.status(200)
              .json(new apiResponse(200 , order , "Order Cancel Sucessfully.."))
});

const getAllOrdersAdminProvider = asyncHandler(async(req,res)=>{

    if (req.user.role !== "admin" && req.user.role !== "provider") {
        throw new apiError(403, "Only Admin Or Provider Can View This Details..");
    }

    const orders = await Order.find()
        .populate("user", "fullName email phoneNumber")
        .populate("products.product", "name finalPrice")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new apiResponse(200, orders, "All orders fetched successfully")
    );
});

const updateOrderStatus = asyncHandler(async (req, res) => {

    if (req.user.role !== "admin" && req.user.role !== "provider") {
        throw new apiError(403, "Not authorized to update order");
    }

    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) {
        throw new apiError(404, "Order not found");
    }

    order.status = status;
    await order.save();

    return res.status(200).json(
        new apiResponse(200, order, "Order status updated successfully"));
});

export { createOrder , getOrders , cancelOrder , getAllOrdersAdminProvider , updateOrderStatus}