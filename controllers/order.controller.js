import { asyncHandler } from "../Utils/asyncHandler.js";
import { apiResponse } from "../Utils/apiResponse.js";
import { apiError } from "../Utils/apiError.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { Coupon } from "../models/coupon.model.js";
import { CouponUsage } from  "../models/couponUsage.model.js";
import { Combo } from "../models/combo.model.js";

const createOrder = asyncHandler(async (req, res) => {

    const { products, addressId, coupon, discountAmount, totalAmount: frontendTotalAmount } = req.body;

    if (!products || products.length === 0) {
        throw new apiError(400, "Add Product For Order..!");
    }

    const user = await User.findById(req.user._id);
    const address = user.addresses.id(addressId);

    if (!address) {
        throw new apiError(400, "Address Is Not Found..!");
    }

    address.addressType = address.addressType?.toUpperCase();

    let originalTotal = 0;
    const orderProducts = [];

    for (let item of products) {

        if (item.comboId) {

            const combo = await Combo.findById(item.comboId)
                .populate("mainProduct")
                .populate("subProducts");

            if (!combo || !combo.isActive) {
                throw new apiError(400, "Invalid combo");
            }

            const comboItems = [combo.mainProduct, ...combo.subProducts];
            const comboOriginalPrice = comboItems.reduce((sum, p) => sum + p.finalPrice, 0);

            for (let p of comboItems) {
                if (p.stock < item.quantity) {
                    throw new apiError(400, `Not enough stock for ${p.name}`);
                }
                const proportionalPrice = (p.finalPrice / comboOriginalPrice) * combo.comboPrice;
                orderProducts.push({
                    product: p._id,
                    quantity: item.quantity,
                    price: Math.round(proportionalPrice),
                    comboId: combo._id,      
                    isCombo: true 
                });
                originalTotal += proportionalPrice * item.quantity;
            }

        } else {

            const product = await Product.findById(item.product);
            if (!product) {
                throw new apiError(404, `Product with id ${item.product} not found.`);
            }
            if (product.stock < item.quantity) {
                throw new apiError(400, `Not enough stock for product ${product.name}.`);
            }
            orderProducts.push({
                product: product._id,
                quantity: item.quantity,
                price: product.finalPrice
            });
            originalTotal += product.finalPrice * item.quantity;
        }
    }

    let discountRatio = 1;
    if (frontendTotalAmount !== undefined && frontendTotalAmount !== null && originalTotal > 0) {
        discountRatio = frontendTotalAmount / originalTotal;
    }

    const order = await Order.create({
        user: req.user._id,
        products: orderProducts.map(p => ({
            product: p.product,
            quantity: p.quantity,
            price: Math.round(p.price * discountRatio)
        })),
        address: address,
        coupon: coupon || null,
        discountAmount: discountAmount || 0,
        totalAmount: frontendTotalAmount ?? originalTotal
    });

    await order.save();

    for (let item of orderProducts) {
        await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity }
        });
    }

    if (coupon) {
        const usedCoupon = await Coupon.findOne({ code: coupon });
        if (usedCoupon) {
            usedCoupon.usedCount += 1;
            await usedCoupon.save();
            await CouponUsage.create({
                coupon: usedCoupon._id,
                user: req.user._id,
                order: order._id
            });
        }
    }

    return res.status(200).json(new apiResponse(200, order, "Order Created Successfully.."));
});

const getOrders = asyncHandler(async(req,res)=>{

    const orders = await Order.find({ user: req.user._id })
    .populate("products.product", "name finalPrice productImage")
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

    for (let item of order.products) {
        await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity }
        });
    }

    return res.status(200)
              .json(new apiResponse(200 , order , "Order Cancel Sucessfully.."))
});

const getAllOrdersAdminProvider = asyncHandler(async (req, res) => {

    if (req.user.role !== "admin" && req.user.role !== "provider") {
        throw new apiError(403, "Only Admin Or Provider Can View This Details..");
    }

    let orders;

    if (req.user.role === "admin") {

        orders = await Order.find()
            .populate("user", "fullName email phoneNumber")
            .populate("products.product", "name finalPrice productImage")
            .sort({ createdAt: -1 });

    } 
    else {
        const providerProducts = await Product.find({ userId: req.user._id }).select("_id");

        const productIds = providerProducts.map(p => p._id);

        orders = await Order.find({
            "products.product": { $in: productIds }
        })
        .populate("user", "fullName email phoneNumber")
        .populate("products.product", "name finalPrice productImage")
        .sort({ createdAt: -1 });

    }

    return res.status(200).json(
        new apiResponse(200, orders, "Orders fetched successfully")
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

const generateCouponCode = (length = 10) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

const createCoupon = asyncHandler(async(req,res)=>{

    if (req.user.role !== "provider" && req.user.role !== "admin") {
        throw new apiError(403, "Only admin or provider can create coupon");
    }

    const providerId = req.user._id;

     const { discountType , discountValue , minOrderValue , expiryDate , maxUsage , applyOn , applicableProducts} = req.body;

     if(!discountType || !discountValue || !expiryDate){
        throw new apiError(401,"Fill Required Details..");        
     }

    let code;
    let isCodeExists = true;

     while (isCodeExists) {
        code = generateCouponCode();
        isCodeExists = await Coupon.findOne({ code });
    }

    // const existingCoupon  = await Coupon.findOne({ code: code });

    //  if(existingCoupon){
    //     throw new apiError(401,"Coupon Is Already Exists..");        
    //  }

    if (applyOn === "SELECTED" && (!applicableProducts || applicableProducts.length === 0)) {
    throw new apiError(400, "Please select products for this coupon");
    }

     const coupon = await Coupon.create({
        code: code,
        provider: providerId,
        discountType,
        discountValue,
        minOrderValue,
        expiryDate,
        maxUsage,
        applyOn,
        applicableProducts: applyOn === "SELECTED" ? applicableProducts : []
    });

    return res.status(200)
              .json(new apiResponse(200,coupon,"Coupon Is Created Sucessfully.."))
});

const applyCoupon = asyncHandler(async(req,res)=>{

    const { code, products } = req.body;

    if(!code || !products || products.length === 0){
        throw new apiError(401,"Coupon Code And Products Are Required!");        
    }

     const coupon = await Coupon.findOne({
        code: code,
        isActive: true
    });
    console.log("Coupon Code :-",coupon.code);

    if(!coupon){
        throw new apiError(404,"Invalid Coupon Code!");
    }

    if (coupon.expiryDate < new Date()) {
        throw new apiError(401, "Coupon Is Expired..");
    }

    if (coupon.usedCount >= coupon.maxUsage) {
        throw new apiError(401, "Coupon Usage Limit Reached..");
    }

    // let providerTotal = 0;

    if (!coupon.provider) {
        throw new apiError(500, "Coupon provider not found");
    }

    const providerId = coupon.provider.toString();

    let eligibleTotal = 0;

    for (let item of products) {
        const product = await Product.findById(item.product);

    if (!product) continue;

    if (product.userId.toString() !== providerId) continue;
    
    if (
        coupon.applyOn === "SELECTED" &&
        !coupon.applicableProducts
            .map(id => id.toString())
            .includes(product._id.toString())
        ) {
            continue;
    }

    eligibleTotal += product.finalPrice * item.quantity;
    }
    console.log("Eligible Total:", eligibleTotal);

    if (eligibleTotal === 0) {
        throw new apiError(401, "Coupon not applicable to selected products");
    }

    if (eligibleTotal < coupon.minOrderValue) {
        throw new apiError(401,`Minimum order value should be ${coupon.minOrderValue}`
        );
    }

    let discountAmount = 0;

    if (coupon.discountType === "Percentage") {
        discountAmount = (eligibleTotal * coupon.discountValue) / 100;
    } else {
        discountAmount = coupon.discountValue;
    }

    if (discountAmount > eligibleTotal) {
        discountAmount = eligibleTotal;
    }

    const payableAmount = eligibleTotal - discountAmount;

    // coupon.usedCount += 1;
    // await coupon.save();

    // const couponUsage =  await CouponUsage.create({
    //     coupon: coupon._id,
    //     user: req.user._id,
    //     // order: orderId,  
    // });

    console.log("Coupon Apply On:", coupon.applyOn, "Applicable Products:", coupon.applicableProducts);
    
    return res.status(200)
              .json(new apiResponse(200,{couponCode: coupon.code,eligibleTotal,discountAmount,payableAmount,},"Coupon Applied Sucessfully"))
});

const viewCoupon = asyncHandler(async(req,res)=>{

    let coupons;

    if (req.user.role === "admin") {
        coupons = await Coupon.find()
            .populate("provider", "fullName email") 
            .sort({ createdAt: -1 });
    } 
    else if (req.user.role === "provider") {
        coupons = await Coupon.find({ provider: req.user._id })
            .sort({ createdAt: -1 });
    } 
    else {
        throw new apiError(403, "Only admin or provider can view coupons");
    }

    return res.status(200)
              .json(new apiResponse(200,coupons,"Coupons Fetched Sucessfullly..."))

}); 

const editCoupon = asyncHandler(async(req,res)=>{

    if (req.user.role !== "provider" && req.user.role !== "admin") {
        throw new apiError(403, "Only provider or admin can edit coupon");
    }

    const { id } = req.params;
    const updates = req.body;

    let coupon;

    if (req.user.role === "admin") {
        coupon = await Coupon.findById(id);
    } else {
        coupon = await Coupon.findOne({ _id: id, provider: req.user._id });
    }

    if (!coupon) {
        throw new apiError(404, "Coupon not found or you are not authorized");
    }

    const allowedFields = ["code", "discountType", "discountValue", "minOrderValue", "expiryDate", "maxUsage", "isActive" , "applyOn","applicableProducts"];
    
    allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
            coupon[field] = updates[field];
        }
    });

    await coupon.save();

    return res.status(200)
              .json(new apiResponse(200,coupon,"Coupon Updated Successfully.."))
});

const deleteCoupon = asyncHandler(async (req, res) => {

    if (req.user.role !== "provider" && req.user.role !== "admin") {
        throw new apiError(403, "Only provider or admin can delete coupon");
    }

    const { id } = req.params;

    let coupon;

    if (req.user.role === "admin") {
        coupon = await Coupon.findById(id);
    } else {
        coupon = await Coupon.findOne({ _id: id, provider: req.user._id });
    }

    if (!coupon) {
        throw new apiError(404, "Coupon not found or you are not authorized");
    }

    await Coupon.findByIdAndDelete(id);

    return res.status(200)
              .json(new apiResponse(200, coupon, "Coupon deleted successfully"));
});

const verifyCoupon = asyncHandler(async(req,res)=>{

    const { code } = req.body;

    if(!code){
        throw new apiError(401,"Coupon Code Is Required..");
    }

    const coupon = await Coupon.findOne({code});

    if (!coupon) return res.status(404).json(new apiResponse(404, null, "Coupon not found"));
    if (!coupon.isActive) return res.status(400).json(new apiResponse(400, null, "Coupon is inactive"));
    if (coupon.expiryDate < new Date()) return res.status(400).json(new apiResponse(400, null, "Coupon has expired"));
    if (coupon.usedCount >= coupon.maxUsage) return res.status(400).json(new apiResponse(400, null, "Coupon usage limit reached"));

    return res.status(200)
              .json(new apiResponse(200,coupon,"Coupon Is Valid.."))
});

export { createOrder , getOrders , cancelOrder , getAllOrdersAdminProvider , updateOrderStatus , createCoupon , applyCoupon , viewCoupon , editCoupon , deleteCoupon , verifyCoupon}