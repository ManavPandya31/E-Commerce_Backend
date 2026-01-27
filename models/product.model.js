import mongoose, { Schema } from "mongoose";

const productSchema = new Schema({
    name : {
        type : String,
        required : true,
    },
    description : {
        type : String,
        required : true,
    },
    price : {
        type : Number,
        required : true,
    },
    
    category : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Category",
        required : true,
    },

    stock : {
        type : Number,
        default : 0,
    },

    productImage : {
        type : String, 
        required : true,
    },

   userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true,
   },
   
   discount : {
         type: {
            type: String,   
            enum: ["Percetange", "Flat"],
            default: null,
    },
  
          value: {
             type: Number,
             default: 0,
    },
},

    finalPrice: {
         type: Number,
}
    
},
    
    {timestamps:true}

);

// productSchema.index({ _id: 1 });

export const Product = mongoose.model("Product",productSchema);