import { Product } from "../models/product.model.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { apiResponse } from "../Utils/apiResponse.js";
import { apiError } from "../Utils/apiError.js";
import { uploadOnCloudinary } from "../Utils/cloudinary.js";
import { Category } from "../models/category.model.js";

const addProduct = asyncHandler(async(req,res)=>{

        const {name , description , price , category , stock , discountType, discountValue} = req.body;

        //console.log("Req Body :- ",req.body);

        if(!name || !description || !price || !category ){
            throw new apiError(401,"Must Required Product Details..");
        }

        if(!req.file){
            throw new apiError(401,"Product Image Is Required..");
        }

        if ((discountType || discountValue) && req.user.role !== "provider") {
             throw new apiError(403, "Only providers can apply discounts");
        }

        const uploadImageOnCloudinary = await uploadOnCloudinary(req.file.buffer);

        if(!uploadImageOnCloudinary){
            throw new apiError(400,"Image Upload Failed On Cloudinary..");
        }

        
    let finalPrice = price;

    if (discountType && discountValue > 0) {

        if (discountType === "Percetange") {
            finalPrice = price - (price * discountValue) / 100;
        }

        if (discountType === "Flat") {
            finalPrice = price - discountValue;
        }

        if (finalPrice < 0) finalPrice = 0;
    }
        
        //Product Creation,
        const product = await Product.create({
            name : name.trim(),
            description : description.trim(),
            price,
            category,
            stock,
            discount: {
            type: discountType || null,
            value: discountValue || 0,
            },
            finalPrice,
            productImage: uploadImageOnCloudinary.secure_url,
            userId: req.user._id,
        });

        return res.status(201)
                .json(new apiResponse(201,product,"Product Created Sucessfully.."))

});

const updateProduct = asyncHandler(async(req,res)=>{

    const {id} = req.params;
    const updates = req.body; 

    const product = await Product.findByIdAndUpdate(
        { _id: id, userId: req.user._id }, 
        updates,
        {new : true},
    );

   // console.log("Updated Product :-",product);
    
    if(!product){
        throw new apiError(401,"Product Is Not Found..");
    }

    return res.status(200)
              .json(new apiResponse(200,product,"Product Updaed Sucesfully"))

});

const deleteProduct = asyncHandler(async(req,res)=>{

    const { id } = req.params;

    const existedProduct = await Product.findById(id);
    //console.log("Right Now The Product Is Existed",existedProduct);

    if(!existedProduct){
        throw new apiError(400,"The Product Is Not Found..");
    }
    
    const deletedProduct = await Product.findByIdAndDelete({_id: id,userId: req.user._id,});
    //console.log("Now Product Is Deleted",deletedProduct);
    
    return res.status(200)
              .json(new apiResponse(200,deletedProduct,"Product Deleted Sucessfully.."))
});

const fetchAllExistedProducts = asyncHandler(async(req,res)=>{

    const categoryId = req.query.categoryId;
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    const query = categoryId ? { category: categoryId } : {};

    const totalProducts = await Product.countDocuments(query)
    //console.log("Total Products in Category :-", totalProducts);

    const products = await Product.find(query).populate({
            path: "userId",
            select: "fullName email phoneNumber role gender"})
            .skip(skip)
            .limit(limit);

    //console.log("All Products :- ",products);
    
   return res.status(200)
   .json(new apiResponse(200, {
            products,
                 pageData: {
                 currentPage: page,
                 totalProducts,
                 totalPages: Math.ceil(totalProducts / limit),
                 //limit,
    },
  }, "Product Fetched Successfully")
);


});

const getSingleProduct = asyncHandler(async(req,res)=>{

    const { id } = req.params;

    const existedProduct = await Product.findById(id);
    //console.log("Product Is Existed",existedProduct);

    if(!existedProduct){
        throw new apiError(401,"Product Is Not Existed That You Find..");
    }   

   const product =  await Product.findById(id);
    //console.log("Product Fetch Sucessfully..",product);

    return res.status(200)
              .json(new apiResponse(200,product,"Product Fetch Sucessfully.."))

});

const myProducts = asyncHandler(async(req,res)=>{

    const userId = req.user._id;

      const products = await Product.find({userId}).populate("category")
      .select("name price finalPrice stock productImage discount");

      if(!products){
        throw new apiError(404, "Products Is Not Found..");
      }

  return res
    .status(200)
    .json(new apiResponse(200, products, "Products Fetched Successfully.."));

});

const createCatrgory = asyncHandler(async(req,res)=>{

    if (req.user.role !== "admin") {
        throw new apiError(403, "Only admin can create category");
    }

    const  { name , description , priority }  = req.body;

        if(!name || !description || priority === undefined){
            throw new apiError(401,"Fill Every Fields..");
        }
    
    const existedCategoty = await Category.findOne({name});

    if(existedCategoty){
        throw new apiError(401,"Category Is Already Existed..");
    }

    if (!Number.isInteger(priority) || priority < 1) {
        throw new apiError(400, "Priority must start from 1");
    }

    const category = await Category.create({
        name : name.trim(), 
        description : description.trim(),
        priority: parseInt(priority),

    });
    //console.log("Created Category Is :-",category);
    
    return res.status(201)
              .json(new apiResponse(201,category,"Category Created Sucessfully.."))
});

const updateCategory = asyncHandler(async (req, res) => {

    if (req.user.role !== "admin") {
        throw new apiError(403, "Only admin can create category");
    }

  const { id } = req.params;
  const { name, description, priority } = req.body;

  const updates = {};

  if (name) updates.name = name.trim();
  if (description) updates.description = description.trim();
  if (priority !== undefined) updates.priority = priority;

  const updatedCategory = await Category.findByIdAndUpdate(
    id,
    updates,
    { new: true } 
  );

  if (!updatedCategory) {
    throw new apiError(404, "Category not found");
  }

  return res.status(200).json(
    new apiResponse(200, updatedCategory, "Category updated successfully")
  );
});

const getCategory = asyncHandler(async (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  const totalCategories = await Category.countDocuments();

  const categories = await Category.find()
    .sort({ priority: 1, createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  //console.log("Categories Are :- ", categories);

  return res.status(200).json(
    new apiResponse(
      200,
      {
        categories,
        pageData: {
          currentPage: page,
          totalCategories,
          totalPages: Math.ceil(totalCategories / limit),
        },
      },
      "All Categories Fetched Successfully"
    )
  );
});

const deleteCategory = asyncHandler(async(req,res)=>{

     if (req.user.role !== "admin") {
        throw new apiError(403, "Only admin can create category");
     }

    const { id } = req.params;

    const category = await Category.findById(id);

        if(!category){
            throw new apiError(401,"The Category Is Not Fiund Tha You Want To Delete..");  
        }

    const deleteCategory = await Category.findByIdAndDelete(id);
    //console.log("Deleted Category Is :-",deleteCategory);
    
    return res.status(201)
              .json(new apiResponse(201,deleteCategory,"Category Deleted Sucessfully"));
});

export { addProduct , updateProduct , deleteProduct , fetchAllExistedProducts ,
getSingleProduct , myProducts , createCatrgory , updateCategory , getCategory , 
deleteCategory};