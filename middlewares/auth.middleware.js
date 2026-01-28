import JWT from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { apiError } from "../Utils/apiError.js";
import { apiResponse } from "../Utils/apiResponse.js";

const verifyJwtToken = asyncHandler(async(req,res,next)=>{
    
    try {   

        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
       // console.log("Authorization:", req.headers.authorization);

        if(!token){
            throw new apiError(401,"UnAuthorized Request");
        }

        const decodeData = JWT.verify(token,process.env.ACCESS_TOKEN_SECRET);
        //console.log("Decoded Data :-",decodeData);
        
        const user = await User.findById(decodeData?._id).select("-password -refreshToken");
        //console.log("user",user);

        if(!user){
            throw new apiError(400,"Invalid Token Access");       
        }

        req.user = user;
        next();
        
    } catch (error) {
        return res.status(401)  
                  .json(new apiResponse(401,"Invalid Or Expired Token"));
    }
    
});

export { verifyJwtToken };