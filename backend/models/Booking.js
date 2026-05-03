const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
    },
    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fromDate:    { type: Date, required: true },
    toDate:      { type: Date, required: true },
    totalDays:   { type: Number, required: true },
    totalAmount: { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "confirmed", "dispatched", "returned", "completed", "cancelled"],
      default: "pending",
    },

    // Payment
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    razorpayOrderId:   { type: String },
    razorpayPaymentId: { type: String },

    // ── CHANGE 1: Condition photos ─────────────────────────────────────────
    // Vendor uploads these photos BEFORE giving equipment to farmer
    dispatchPhotos: {
      images: [{ type: String }],       // base64 or URL strings
      uploadedAt: { type: Date },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      note: { type: String },           // optional condition note e.g. "small scratch on left side"
    },

    // Farmer uploads these photos WHEN returning equipment
    returnPhotos: {
      images: [{ type: String }],
      uploadedAt: { type: Date },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      note: { type: String },
    },

    // Vendor marks condition after comparing dispatch vs return photos
    conditionVerified: { type: Boolean, default: false },
    conditionNote: { type: String },    // e.g. "returned with dent on bonnet"
    damageReported: { type: Boolean, default: false },
    // ──────────────────────────────────────────────────────────────────────

    // Cancellation
    cancelledBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancellationNote: { type: String },

    // Review (filled after completion)
    review: {
      rating:    { type: Number, min: 1, max: 5 },
      comment:   { type: String },
      createdAt: { type: Date },
    },
  },
  { timestamps: true }
);

// Auto-calculate totalDays before saving
bookingSchema.pre("save", function (next) {
  if (this.fromDate && this.toDate) {
    const diff = new Date(this.toDate) - new Date(this.fromDate);
    this.totalDays = Math.ceil(diff / (1000 * 60 * 60 * 24)) || 1;
  }
  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
