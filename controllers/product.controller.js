import { Product } from "../models/product.model.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { apiResponse } from "../Utils/apiResponse.js";
import { apiError } from "../Utils/apiError.js";
import { uploadOnCloudinary } from "../Utils/cloudinary.js";
import { Category } from "../models/category.model.js";
import { Combo } from "../models/combo.model.js";

const addProduct = asyncHandler(async(req,res)=>{

        const {name , description , price , category , stock , discountType, discountValue,} = req.body;

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

        if (discountType === "Percentage") {
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

// const updateProduct = asyncHandler(async(req,res)=>{

//     const {id} = req.params;
//     const updates = req.body; 

//     const product = await Product.findByIdAndUpdate(
//         { _id: id, userId: req.user._id }, 
//         updates,
//         {new : true},
//     );

//    // console.log("Updated Product :-",product);
    
//     if(!product){
//         throw new apiError(401,"Product Is Not Found..");
//     }

//     let finalPrice = product.price;

//   if (discountType) {
//     if (discountType === "Percentage") {
//       finalPrice =
//         product.price -
//         (product.price * Number(discountValue || 0)) / 100;
//     }

//     if (discountType === "Flat") {
//       finalPrice =
//         product.price - Number(discountValue || 0);
//     }

//     if (finalPrice < 0) finalPrice = 0;

//     product.discount = {
//       type: discountType,
//       value: Number(discountValue || 0),
//     };
//   } else {
//     product.discount = {
//       type: null,
//       value: 0,
//     };
//   }

//   product.finalPrice = finalPrice;

//   await product.save();

//     return res.status(200)
//               .json(new apiResponse(200,product,"Product Updaed Sucesfully"))

// });

const updateProduct = asyncHandler(async (req, res) => {

  const { id } = req.params;
  const {name,description,price,category,stock,discountType,discountValue,} = req.body;

  const product = await Product.findOne({ _id: id, userId: req.user._id });

  if (!product) {
    throw new apiError(404, "Product Not Found");
  }

  if (name) product.name = name.trim();
  if (description) product.description = description.trim();
  if (price) product.price = Number(price);
  if (category) product.category = category;
  if (stock) product.stock = stock;

  let finalPrice = product.price;

  if (discountType) {
    if (discountType === "Percentage") {
      finalPrice =
        product.price -
        (product.price * Number(discountValue || 0)) / 100;
    }

    if (discountType === "Flat") {
      finalPrice =
        product.price - Number(discountValue || 0);
    }

    if (finalPrice < 0) finalPrice = 0;

    product.discount = {
      type: discountType,
      value: Number(discountValue || 0),
    };
  } else {
    product.discount = {
      type: null,
      value: 0,
    };
  }

  product.finalPrice = finalPrice;

  await product.save();

  return res
    .status(200)
    .json(new apiResponse(200, product, "Product Updated Successfully"));
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

const getRelatedProducts = asyncHandler(async(req,res)=>{

    const { id } = req.params;

    const product = await Product.findById(id);

    if(!product){
        throw new apiError(404,"Product Is Not Found..");
    }

    const relatedProducts = await Product.find({
         category: product.category,
        _id: { $ne: product._id }, 
    })
    .select("name price finalPrice productImage stock")
    .limit(6);

    return res.status(200)
              .json(new apiResponse(200,relatedProducts,"Related Products Fetch Seucssfully.."))
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

const createCombo = asyncHandler(async(req,res)=>{

    if(req.user.role !== "provider"){
        throw new apiError(401,"You Are Not Eligable To Create Combo..");
    }

    const { mainProduct, subProducts, comboPrice } = req.body;

    if(!mainProduct || !subProducts || subProducts.length===0){
        throw new apiError(404,"Some Fields Is Missing..");
    }

    if (!comboPrice || comboPrice <= 0) {
        throw new apiError(400, "Invalid combo price");
    }

    if (subProducts.includes(mainProduct)) {
         throw new apiError(400, "Main product cannot be sub product");
    }

    const products = await Product.find({
         _id: { $in: [mainProduct, ...subProducts] },
         userId: req.user._id
    });

    if (products.length !== subProducts.length + 1) {
         throw new apiError(400, "Invalid products selected");
    }

    const originalPrice = products.reduce(
        (sum, p) => sum + p.finalPrice,
        0
    );

    if (comboPrice > originalPrice) {
        throw new apiError(400, "The Original Price Is Lower Then This Price..");
    }

    const combo = await Combo.create({
        providerId: req.user._id,
        mainProduct,
        subProducts,
        comboPrice,
        originalPrice,
        isActive: true,
    });

    return res.status(200)
              .json(new apiResponse(200,combo,"Combo Created Sucessfully.."))

});

// const getCombo = asyncHandler(async(req,res)=>{

//     const combos = await Combo.find({isActive : true})  
//         .populate({ path: "mainProduct", select: "name finalPrice productImage stock"})
//         .populate({ path: "subProducts", select: "name finalPrice productImage stock"}).lean();

//     //console.log("Combos found:", combos);

//     if(!combos || combos.length === 0){
//         throw new apiError(404,"No Combos Available..");
//     }

//     return res.status(200)
//               .json(new apiResponse(200,combos,"Combos Are Fetch Sucessfully.."))
// });

const getComboProduct = asyncHandler(async(req,res)=>{

    const { productId } = req.params;

    if(!productId){
        throw new apiError(404,"Missing Fields...");
    }

    const combo = await Combo.findOne( {mainProduct: productId , isActive: true })
             .populate("mainProduct", "name finalPrice productImage")
             .populate("subProducts", "name finalPrice productImage");

     if (!combo) {
        return res.status(200).json(
            new apiResponse(200, null, "No combo available for this product"));
        }

    return res.status(200)  
              .json(new apiResponse(200,combo,"Combo Is Fetch Sucess For This Product.."))
});

const getProvidersCombo = asyncHandler(async(req,res)=>{

    if(req.user.role !== "provider"){
        throw new apiError(401,"Only Product Provider Can View His Product Combs..");
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const providerId = req.user._id;
    const totalCombos = await Combo.countDocuments({ providerId });

    const combos = await Combo.find({ providerId })
        .populate({ path: "mainProduct" , select: "name finalPrice productImage stock" })
        .populate({ path: "subProducts" , select: "name finalPrice productImage stock" })
        .skip(skip)
        .limit(limit)
        .lean();

    if(!combos || combos.length === 0){
        throw new apiError(404,"No Combos Found For This Provider...");
    }

    return res.status(200)
        .json(new apiResponse(200, {
            combos,
            pagination: {
                totalCombos,
                totalPages: Math.ceil(totalCombos / limit),
                currentPage: page,
                limit
            }
        }, "Combos fetched successfully"));
});

const getAllCombos = asyncHandler(async(req,res)=>{

    if(req.user.role !== "admin"){
        throw new apiError(401,"Only Admin Can Do This...");
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalCombos = await Combo.countDocuments();

    const combos = await Combo.find()
        .populate({ path: "providerId" , select: "fullName email phoneNumber" })
        .populate({ path: "mainProduct" , select: "name finalPrice productImage stock" })
        .populate({ path: "subProducts" , select: "name finalPrice productImage stock" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    if(!combos || combos.length === 0){
        throw new apiError(404,"No Combos Found..");
    }

    return res.status(200)
              .json(new apiResponse(200,{ combos , pageData : { currentPage : page , totalCombos , totalCombos : Math.ceil(totalCombos/limit)},},"All Combos Fetch Sucessfully.."))

});

const updateCombo = asyncHandler(async(req,res)=>{

    if(req.user.role !== "provider"){
        throw new apiError(401,"Only Provider Can Update Combos... ");
    }

    const { id } = req.params;
    const { mainProduct, subProducts, comboPrice, isActive } = req.body;

    const combo = await Combo.findOne({ _id: id, providerId: req.user._id });

        if(!combo){
            throw new apiError(404,"Combo Is Not Found..");
        }

         if (mainProduct) combo.mainProduct = mainProduct;
         if (subProducts && subProducts.length > 0) combo.subProducts = subProducts;
         if (typeof isActive === "boolean") combo.isActive = isActive;

    if (combo.subProducts.includes(combo.mainProduct)) {
        throw new apiError(400, "Main product cannot be sub product");
    }

    const products = await Product.find({
        _id: { $in: [combo.mainProduct, ...combo.subProducts] },
        userId: req.user._id,
    });

    if (products.length !== combo.subProducts.length + 1) {
        throw new apiError(400, "Invalid products selected");
    }

    const originalPrice = products.reduce(
        (sum, p) => sum + p.finalPrice,
        0
    );

    if (comboPrice) {
        if (comboPrice <= 0 || comboPrice > originalPrice) {
            throw new apiError(400, "Invalid combo price");
        }
        combo.comboPrice = comboPrice;
    }

    combo.originalPrice = originalPrice;

    await combo.save();

    return res.status(200)
              .json(new apiResponse(200,combo,"Combo Updated Sucessfully.."))

});

const deleteCombo = asyncHandler(async(req,res)=>{

    if(req.user.role !== "provider"){
        throw new apiError(401,"Only Provider Can Delete...");
    }

    const { id } = req.params;

    const combo = await Combo.findOneAndDelete({ _id: id, providerId: req.user._id });

    if(!combo){
        throw new apiError(404,"Combo Not Found..");
    }

    return res.status(200)
              .json(new apiResponse(200,combo,"Combo Deleted Sucessfully.."))

});

export { addProduct , updateProduct , deleteProduct , fetchAllExistedProducts ,
getSingleProduct , myProducts , createCatrgory , updateCategory , getCategory , 
deleteCategory , getRelatedProducts  , createCombo  , getComboProduct ,
getProvidersCombo , getAllCombos , updateCombo , deleteCombo};