import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema({

    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true,
    },

    products : [
        {
            product : {
                type : mongoose.Schema.Types.ObjectId,
                ref : "Product",
                required : true,
            },

            quantity : {
                type : Number,
                required : true,
            },

            price : {
                type : Number,
                required : true,
            },
        }
    ],

    address: {
        // fullName: String,
        mobile: String,
        alternatePhone: String,
        street: String,
        city: String,
        state: String,
        pincode: String,    

        country : { 
            type: String, default: "India" 
        },

        addressType : {
             type: String, enum: ["HOME", "WORK" , "UNIVERSITY"], default: "HOME" 
        },
  },

    totalAmount : {
        type : Number,
        required : true,
    },

    status: {
        type: String,
        enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"],
        default: "Pending"
  },

    // paymentMethod: {
    //     type: String,
    //     enum: ["COD", "Online"],
    //     default: "COD"
    // },
},
    
{timestamps: true});

export const Order = mongoose.model("Order",orderSchema);