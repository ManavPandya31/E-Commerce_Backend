import { apiError } from "../Utils/apiError.js";

export const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return next(new apiError(403, "Only admin can perform this action"));
  }
  next();
};
