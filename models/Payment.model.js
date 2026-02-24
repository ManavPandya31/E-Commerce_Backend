import mongoose, { Schema } from "mongoose";

const paymentSchema = new Schema(
  {
    order_id: {
      type: String,
      required: true,
      index: true,
    },

    payment_id: {
      type: String,
      default: null,
    },

    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    provider_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Payment amount (store in rupees)
    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: ["processing", "failed", "success"],
      default: "processing",
    },

    payment_method: {
      type: String,
      default: null,
    },

    // razorpay_signature: {
    //   type: String,
    //   default: null,
    // },

    failure_reason: {
      type: String,
      default: null,
    },
  },
  
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);