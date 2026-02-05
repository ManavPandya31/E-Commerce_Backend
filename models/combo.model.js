import mongoose , { Schema } from "mongoose";

const comboSchema = new Schema({
    
    providerId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true,
    },

    mainProduct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    subProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    }],

    comboPrice: {
        type: Number,
        required: true
    },

    originalPrice: {
        type: Number 
    },

    sActive: {
        type: Boolean,
        default: true
    },
},
    
    {timestamps:true});

export const Combo = mongoose.model("Combo",comboSchema);