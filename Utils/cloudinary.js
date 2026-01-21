
import { v2 as cloudinary } from "cloudinary";

let isCloudinaryConfigured = false;

const configureCloudinary = () => {
  if (isCloudinaryConfigured) 
    return;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
  });

  isCloudinaryConfigured = true;
};

const uploadOnCloudinary = async (fileBuffer, folder = "products") => {
  try {
    configureCloudinary();

    if (!fileBuffer) return null;

    return await new Promise((res, rej) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) 
            return rej(error);
          res(result);
        }
      );

      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    console.log("Cloudinary Upload Error:", error);
    return null;
  }
};

export { uploadOnCloudinary };
