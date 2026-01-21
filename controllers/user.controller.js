import { asyncHandler } from "../Utils/asyncHandler.js";
import { apiResponse } from "../Utils/apiResponse.js";
import { apiError } from "../Utils/apiError.js";
import { User } from "../models/user.model.js";

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

const userRegister = asyncHandler(async(req,res)=>{
    const { fullName , email , password , phoneNumber , gender } = req.body;
    
    const role  = req.params.role || req.query.role;
    //const role = req.query.role;
    if(!fullName || !email || !password || !gender || !phoneNumber){

        throw new apiError(400,"Fill All The Required Fields..");
    }
   //Find User In Database Id That Is Already Exists Or Not..
   const userExisted =  await User.findOne({email});
   //console.log(userExisted);

    if(userExisted){
        throw new apiError(400,"User Is Already Existed..");
    }

    const user = await User.create({
        fullName,
        email,
        password,
        phoneNumber,
        gender,
        role,
    });

    return res.status(200)
              .json(new apiResponse(200,user,"User Registered Sucessfully.."));
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

export { userRegister , loginUser , accessAndRefreshTokens };