//Create Server..

import dotenv from "dotenv";

dotenv.config({path : "./.env"});

import app from "./app.js";
import connectDB from "./DB/connectDB.js";

connectDB()
    .then(()=>{
        app.listen(process.env.PORT || 3000,()=>{
        console.log(`Server Running At ${process.env.PORT}`); 
    });
})
    .catch((error)=>{
        console.log("Serever Connection Error",error);
});