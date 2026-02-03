import mongoose , { Schema } from "mongoose";

const couponSchema = new Schema({

    code : {
        type : String,
        required : true,
        unique : true,
        uppercase: true,
        trim: true
    },

    provider : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true,
    },

    discountType : {
        type : String,
        enum: ["Flat", "Percentage"],
        required : true,
    },

    discountValue : {
        type : Number,
        required : true,
    },

    minOrderValue : {
        type : String,
        default : 0,
    },

    expiryDate : {
        type : Date,
        required : true,
    },

    maxUsage : {
        type : Number,
        default : 1,
    },

    usedCount : {
        type : Number,
        default : 0,
    },

    isActive : {
        type : Boolean,
        default : true,
    },
},{timestamps : true});

export const Coupon = mongoose.model("Coupon",couponSchema)