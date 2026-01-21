import multer from "multer";

// const storage = multer.diskStorage({
//     destination : function(req,file,callback){
//         callback(null,"./public/temp");
//     },

//     filename :function (req,file,callback) {
//      callback(null,file.originalname);
//     }
// });

const storage = multer.memoryStorage();

export const upload = multer({
        storage,
});