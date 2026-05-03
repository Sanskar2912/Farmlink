const mongoose = require("mongoose");

const equipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Equipment name is required"],
      trim: true,
    },
    description: { type: String, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["tractor", "harvester", "sprayer", "seeder", "pump", "tiller", "other"],
    },
    pricePerDay: {
      type: Number,
      required: [true, "Price per day is required"],
      min: [1, "Price must be at least ₹1"],
    },

    // ── CHANGE 2: Single image instead of array ────────────────────────────
    // Vendor/farmer uploads exactly ONE photo when listing equipment.
    // Stored as a base64 string or a URL (e.g. from Cloudinary in production).
    image: {
      type: String,
      default: null,          // null means no image uploaded yet
    },
    // ──────────────────────────────────────────────────────────────────────

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ownerType: {
      type: String,
      enum: ["farmer", "vendor"],
      required: true,
    },

    city:    { type: String, trim: true },
    state:   { type: String, trim: true, default: "Uttar Pradesh" },
    pincode: { type: String },

    isAvailable: { type: Boolean, default: true },

    bookedDates: [
      {
        from:     { type: Date, required: true },
        to:       { type: Date, required: true },
        bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],

    rating:       { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

equipmentSchema.methods.isDateAvailable = function (from, to) {
  const reqFrom = new Date(from);
  const reqTo   = new Date(to);
  return !this.bookedDates.some((b) => reqFrom <= b.to && reqTo >= b.from);
};

module.exports = mongoose.model("Equipment", equipmentSchema);
