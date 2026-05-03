const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    description: { type: String, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["seeds", "fertilizer", "pesticide", "tools", "grain", "vegetable", "other"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [1, "Price must be at least ₹1"],
    },
    unit: {
      type: String,
      enum: ["kg", "quintal", "litre", "piece", "bag", "bundle"],
      default: "kg",
    },
    stock: { type: Number, default: 0, min: 0 },
    images: [{ type: String }],

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerType: {
      type: String,
      enum: ["farmer", "vendor"],
      required: true,
    },

    city:  { type: String, trim: true },
    state: { type: String, trim: true, default: "Uttar Pradesh" },

    rating:       { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
