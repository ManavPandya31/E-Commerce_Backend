import mongoose , {Schema} from "mongoose";

const categorySchema = new Schema({

    name:{
        type:String,
        required:true,
        unique:true,
        trim : true,
        index : true,
    },

    description:{
        type:String,
        required:true, 
        trim : true, 
    },

    priority :{
        type:Number,
        required : true,
        min : 1,
        default: 999,
        index : true,
    },
    
},    
    {timestamps:true})

export const Category = mongoose.model("Category",categorySchema);