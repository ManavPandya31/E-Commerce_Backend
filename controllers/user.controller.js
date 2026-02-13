import { asyncHandler } from "../Utils/asyncHandler.js";
import { apiResponse } from "../Utils/apiResponse.js";
import { apiError } from "../Utils/apiError.js";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import crypto from "crypto";
import sendEmail from "../Utils/sendEmail.js"

    const options = {
                httpOnly : true,
                secure : true,
             };

//We Already Generate Tokens Now Here We Declare That Tokens..  
const accessAndRefreshTokens = async(userId)=>{

   try {
     const user = await User.findById(userId);
     const accessToken = await user.generateAccessToken();
     const refreshToken = await user.generateRefreshToken();

      user.refreshToken = refreshToken;
         await user.save({ validateBeforeSave : false });

         return { accessToken , refreshToken }

   } catch (error) {
        throw new apiError(501,"Something Problem While Genarate Tokens");
   }

};

const verifyEmail = asyncHandler(async(req,res)=>{

  const { token } = req.params;

   const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new apiError(400, "Invalid or expired verification link");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;

  await user.save();

  return res.status(200)
            .json(new apiResponse(200,null,"Email Is Verified Sucessfully.."))
});

const verifyOtp = asyncHandler(async(req,res)=>{

  const { email , otp } = req.body;

    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    const user = await User.findOne({
        email,
        resetPasswordOTP: hashedOTP,
        resetPasswordOTPExpires: { $gt: Date.now() },
    });

    if(!user){
      throw new apiError(404,"Invaild OTP..");
    }

    return res.status(200)
              .json(new apiResponse(200,null,"OTP Verified Sucessfully.."))
});

const forgotPassword = asyncHandler(async (req, res) => {

    const { email } = req.body;

    if (!email) {
        throw new apiError(400, "Email is required");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new apiError(404, "User not found");
    }

    if (
        user.resetPasswordOTPExpires &&
        user.resetPasswordOTPExpires > Date.now()
    ) {
        throw new apiError(429,"Please wait before requesting a new OTP");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedOTP = crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");

    user.resetPasswordOTP = hashedOTP;
    user.resetPasswordOTPExpires = Date.now() + 30 * 1000;

    await user.save({ validateBeforeSave: false });

    await sendEmail({
        to: email,
        subject: "Reset Password OTP",
        html: `
          <h2>Password Reset OTP</h2>
          <p>Your OTP is:</p>
          <h3>${otp}</h3>
          <p>This OTP expires in 30 seconds.</p>
        `,
    });

    return res.status(200).json(
        new apiResponse(200, null, "OTP sent successfully")
    );
});

const resetPassword = asyncHandler(async (req, res) => {

    const { email, otp, password } = req.body;

    if (!password || !otp || !email) {
        throw new apiError(400, "Email, OTP, and password are required");
    }

    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    const user = await User.findOne({
        email,
        resetPasswordOTP: hashedOTP,
        resetPasswordOTPExpires: { $gt: Date.now() },
    });

    if (!user) {
        throw new apiError(400, "Invalid or expired OTP");
    }

    user.password = password;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new apiResponse(200, null, "Password reset successfully"));
});

const userRegister = asyncHandler(async(req,res)=>{
  try {
    
      const { fullName , email , password , phoneNumber , gender } = req.body;
      
      const role  = req.params.role || req.query.role;
      //const role = req.query.role;
      if(!fullName || !email || !password || !gender || !phoneNumber){
  
          throw new apiError(400,"Fill All The Required Fields..");
      }
     //Find User In Database Id That Is Already Exists Or Not..
     const userExisted =  await User.findOne({ email });
     //console.log(userExisted);
  
      if(userExisted){
          throw new apiError(400,"User Is Already Existed..");
      }
  
      const emailToken = crypto.randomBytes(32).toString("hex");
  
      const user = await User.create({
          fullName,
          email,
          password,
          phoneNumber,
          gender,
          role,
          emailVerificationToken: emailToken,
          emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
      });
  
       //console.log("USER CREATED:", user);    
  
      const verifyLink = `http://localhost:5173/verifyEmail/${emailToken}`; 
      console.log(verifyLink);
  
      const emailResponse = await sendEmail({
          to: email,
          subject: "Verify Your Email",
          html: `
            <h2>Email Verification</h2>
            <p>Click below to verify your email:</p>
            <a href="${verifyLink}">Verify Email</a>
            <p>This link expires in 24 hours.</p>`,
        });
  
      //console.log("Email Response :-",emailResponse);
        
      return res.status(200)
                .json(new apiResponse(200,user,"User Registered Sucessfully.."));

  } catch (error) {
     console.error("REGISTER ERROR ", error);
    throw error;
  }
});

const loginUser = asyncHandler(async(req,res)=>{

    console.log("Req Body",req.body);
    
    const { email , password } = req.body;

        if(!email || !password){
            throw new apiError(400,"Register Required First..");
        }

     const user = await User.findOne({email});
        
     console.log("User Is :-",user);

     if(!user){
        throw new apiError(400,"User Is Not Found..");
     }

     if (!user.isEmailVerified) {
        throw new apiError(401, "Please Verify Your Email First..");
     }

 // When User Do The Login Then We Want To Do Compare The Password Then User Login Sucess..
    
     const isPasswordValid = await user.isPasswordCorrect(password);
       //console.log("Is Password Valid",isPasswordValid);
            if(!isPasswordValid){
                throw new apiError(400,"Password Is Incorrect..");
            }

     const { accessToken , refreshToken } = await accessAndRefreshTokens(user._id);
             
     const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

        return res.status(200)
                   .cookie("accessToken",accessToken,options)
                   .cookie("refreshToken",refreshToken,options)
                   .json(new apiResponse(200,  
                        { user: loggedInUser,accessToken,refreshToken },
                            "User Logged In Successfully"   
        )
    );

});

const userDetails = asyncHandler(async(req,res)=>{

    const user = req.user;

    if(!user){
        throw new apiError(201,"Unauthorized!");
    }

    const eUser = await User.findById(user).select("fullName");

    if(!eUser){
        throw new apiError(201,"Invalid User!");
    }

    return res.status(200)
              .json(new apiResponse(200,user,"Profile Fetch Suces"))

});

const getAllUsers = asyncHandler(async (req, res) => {

    const users = await User.find().select("-password");

    if (!users) {
        throw new apiError(404, "No users found");
    }

    res.status(200).json(
        new apiResponse(200, users, "All users fetched successfully")
    );
});

const getUsersByRole = asyncHandler(async (req, res) => {

    const { role } = req.query;

    const filter = role ? { role } : {};

    const users = await User.find(filter).select("-password");

    res.status(200).json(
        new apiResponse(200, users, "Users fetched successfully")
    );
});

const getAdminDashboardStats = asyncHandler(async (req, res) => {

//   if (req.user.role !== "admin") {
//     throw new apiError(403, "Only admin can access dashboard stats");
//   }

  const [customerCount,providerCount,productCount,orderCount] = await Promise.all([
    User.countDocuments({ role: "customer" }),
    User.countDocuments({ role: "provider" }),
    Product.countDocuments(),
    Order.countDocuments()
  ]);

  return res.status(200)
            .json(new apiResponse(200,{
                            customers: customerCount,
                            providers: providerCount,
                            products: productCount,
                            orders: orderCount
                        },"Admin dashboard stats fetched successfully"));
});

const addAddress = asyncHandler(async(req,res)=>{
    
    const userId = req.user._id;
    const newAddress = req.body;

    if (newAddress.isDefault) {
      await User.updateOne(
        { _id: userId },
        { $set: { "addresses.$[].isDefault": false } }
      );
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { addresses: newAddress } },
      { new: true }
    );

    return res.status(200)
              .json(new apiResponse(200,user,"Address Added Sucessfully."))
});

const getAllAddress = asyncHandler(async(req,res)=>{
    
    //const user =  req.user;
    const user = await User.findById(req.user._id).select("addresses");

    return res.status(200)
              .json(new apiResponse(200,user,"Address Fetch Sucessfully"))
});

const updateAddress = asyncHandler(async (req, res) => {

  const { addressId } = req.params;
  const userId = req.user._id;

  console.log("Address Id", addressId);
  

  if (req.body.isDefault) {
    await User.updateOne(
      { _id: userId },
      { $set: { "addresses.$[].isDefault": false } }
    );
  }

  // build safe update object
  const updateFields = {};
  for (const key in req.body) {
    updateFields[`addresses.$.${key}`] = req.body[key];
  }

  const user = await User.findOneAndUpdate(
    { _id: userId, "addresses._id": addressId },
    { $set: updateFields },
    { new: true }
  );

  if (!user) {
    throw new apiError(404, "Address not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, user, "Address Updated Successfully"));
});

const deleteAddress = asyncHandler(async (req, res) => {

  const userId = req.user._id;
  const { addressId } = req.params;

  await User.findByIdAndUpdate(
    userId,
    { $pull: { addresses: { _id: addressId } } },
    { new: true }
  );

  return res
    .status(200)
    .json(new apiResponse(200, null, "Address Deleted Successfully"));
});

export { userRegister , verifyEmail , loginUser , accessAndRefreshTokens , userDetails ,
addAddress , getAllAddress , updateAddress , deleteAddress , forgotPassword ,resetPassword,
verifyOtp , getAllUsers  , getUsersByRole , getAdminDashboardStats};