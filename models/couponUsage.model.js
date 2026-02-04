import mongoose, { mongo, Schema } from "mongoose";

const couponUsageSchema = new Schema({

    coupon : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Coupon",
        required : true,
    },

    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true,
    },

    order : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Order",
        required : true,
    },
    
    usedAt : {
        type : Date,
        default : Date.now,
    },

},{timestamps : true});

export const CouponUsage = mongoose.model("CouponUsage",couponUsageSchema);