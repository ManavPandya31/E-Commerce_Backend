import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const addressSchema = new Schema(
  {
    // fullName: {
    //   type: String,
    //   required: true
    // },

    mobile: {
      type: String,
      required: true
    },

    alternatePhone: { 
        type: String,
         default: "" 
    },

    street: {
      type: String,
      required: true
    },

    city: {
      type: String,
      required: true
    },

    state: {
      type: String,
      required: true
    },

    pincode: {
      type: String,
      required: true
    },

    country: {
      type: String,
      default: "India"
    },

    addressType: {
      type: String,
      enum: ["Home", "Work"],
      default: "Home"
    },

    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { _id: true }
);

const userSchema = new Schema({
    fullName : {
        type : String,
        required : true,
    },

    email : {
        type : String,
        required : true,
        unique : true,
    },

    phoneNumber : {
        type : Number,
    },

    gender : {
        type : String,
        enum : ["male","female","other"],
        required : true,
    },

    role: {
        type : String,
        enum : ["customer","provider","admin"],
        //default : "customer",
    },  

    password : {
        type : String,          
        required : true,
    },

    refreshToken : {
        type : String,
    },

     addresses: [addressSchema] 
},

    {timestamps : true}
);

//Password Encryption..
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
       return ;
    }

    this.password = await bcrypt.hash(this.password, 10);
    //next();
});

userSchema.methods.isPasswordCorrect = async function(password) {
        return await bcrypt.compare(password,this.password)
}

//Generate Access Token And Refresh Tokens..
userSchema.methods.generateAccessToken = async function(){
    return jwt.sign({
        _id : this._id,
        email : this.email, 
    },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY      
        }
)}

userSchema.methods.generateRefreshToken = async function() {
    return jwt.sign({
             _id : this._id,
        },
              process.env.REFRESH_TOKEN_SECRET,
        {
              expiresIn : process.env.REFRESH_TOKEN_EXPIRY
       }
    )
}

export const User = mongoose.model("User",userSchema);