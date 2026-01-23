import mongoose, { Schema } from "mongoose";

const cartItemSchma = new Schema({
    product : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Product",
        required : true,
    },

    quantity : {
        type : Number,
        default : 1,
        min : 1,
    },
    price : {
        type : Number,
        required : true,
    },
},
    
{timestamps : true});

const cartSchema = new Schema({
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true,
    },
    
    items : [cartItemSchma],

    totalAmount: {
        type: Number,
        default: 0,
    },
},
    { timestamps : true },
);

cartSchema.index({ user: 1 });

cartSchema.index({ "items.product": 1 });

// cartSchema.index({ user: 1 }, { unique: true });

export const Cart = mongoose.model("Cart",cartSchema);