const express  = require("express");
const Razorpay = require("razorpay");
const crypto   = require("crypto");
const Booking  = require("../models/Booking");
const Order    = require("../models/Order");
const Product  = require("../models/Product");
const { protect } = require("../middleware/auth");

const router = express.Router();

// ── Helper: get Razorpay instance with validation ─────────────────────────
// Created per-request so missing keys give a clear error instead of crashing
const getRazorpay = () => {
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || keyId.includes("xxxxxxx") || keyId.trim() === "") {
    throw new Error("RAZORPAY_KEY_ID is not set in your .env file. Get test keys from razorpay.com/dashboard");
  }
  if (!keySecret || keySecret.includes("xxxxxxx") || keySecret.trim() === "") {
    throw new Error("RAZORPAY_KEY_SECRET is not set in your .env file.");
  }
  if (!keyId.startsWith("rzp_")) {
    throw new Error("Invalid RAZORPAY_KEY_ID format. It should start with rzp_test_ or rzp_live_");
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

// ─── POST /api/payments/booking/create-order ──────────────────────────────
router.post("/booking/create-order", protect, async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ message: "bookingId is required." });
    }

    const booking = await Booking.findById(bookingId).populate("equipment", "name pricePerDay city");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    // Only the renter can pay
    if (booking.renter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the renter can pay for this booking." });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(400).json({ message: "This booking is already paid." });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Cannot pay for a cancelled booking." });
    }

    // Allow payment for both pending and confirmed bookings
    // Payment on pending will auto-confirm the booking
    const amountPaise = Math.round(booking.totalAmount * 100); // must be integer

    // ✅ FIX: Create Razorpay instance here, not at module load time
    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount:   amountPaise,
      currency: "INR",
      receipt:  `bk_${bookingId.toString().slice(-8)}`, // max 40 chars
      notes: {
        bookingId: bookingId.toString(),
        equipment: booking.equipment?.name || "",
        renter:    req.user.name,
      },
    });

    booking.razorpayOrderId = order.id;
    await booking.save();

    res.json({
      orderId:   order.id,
      amount:    amountPaise,
      currency:  "INR",
      keyId:     process.env.RAZORPAY_KEY_ID,
      bookingId: bookingId,
      name:      booking.equipment?.name || "Equipment Rental",
      description: `Rental: ${booking.totalDays} day(s) · ₹${booking.totalAmount.toLocaleString()}`,
      prefill: {
        name:    req.user.name,
        email:   req.user.email,
        contact: req.user.phone,
      },
    });

  } catch (err) {
    console.error("Create booking order error:", err.message);

    // Give clear, specific error messages
    if (err.message.includes("RAZORPAY_KEY")) {
      return res.status(500).json({ message: err.message });
    }
    if (err.statusCode === 401 || err.message.includes("401")) {
      return res.status(500).json({ message: "Razorpay authentication failed. Check your KEY_ID and KEY_SECRET in .env — make sure they are test keys (rzp_test_...)." });
    }
    if (err.statusCode === 400) {
      return res.status(500).json({ message: `Razorpay error: ${err.error?.description || err.message}` });
    }
    res.status(500).json({ message: "Payment initiation failed: " + err.message });
  }
});

// ─── POST /api/payments/booking/verify ────────────────────────────────────
router.post("/booking/verify", protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification fields." });
    }

    // Verify signature using HMAC SHA256
    const body     = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed — signature mismatch. Do not retry." });
    }

    // Mark booking as paid and auto-confirm
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        paymentStatus:     "paid",
        razorpayPaymentId: razorpay_payment_id,
        status:            "confirmed",
      },
      { new: true }
    ).populate("equipment", "name city pricePerDay");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found after payment." });
    }

    res.json({ message: "Payment successful!", booking });

  } catch (err) {
    console.error("Verify booking payment error:", err.message);
    res.status(500).json({ message: "Payment verification failed: " + err.message });
  }
});

// ─── POST /api/payments/order/create-order ────────────────────────────────
router.post("/order/create-order", protect, async (req, res) => {
  try {
    const { items, deliveryAddress } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in order." });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}.` });
      }
      totalAmount += product.price * item.quantity;
      orderItems.push({ product: product._id, quantity: item.quantity, price: product.price });
    }

    const dbOrder = await Order.create({
      buyer: req.user._id, items: orderItems, totalAmount,
      deliveryAddress, status: "pending", paymentStatus: "unpaid",
    });

    const razorpay = getRazorpay();
    const rzpOrder = await razorpay.orders.create({
      amount:   Math.round(totalAmount * 100),
      currency: "INR",
      receipt:  `ord_${dbOrder._id.toString().slice(-8)}`,
      notes:    { orderId: dbOrder._id.toString(), buyer: req.user.name },
    });

    dbOrder.razorpayOrderId = rzpOrder.id;
    await dbOrder.save();

    res.json({
      orderId:   rzpOrder.id,
      amount:    Math.round(totalAmount * 100),
      currency:  "INR",
      keyId:     process.env.RAZORPAY_KEY_ID,
      dbOrderId: dbOrder._id,
      prefill: { name: req.user.name, email: req.user.email, contact: req.user.phone },
    });

  } catch (err) {
    console.error("Create product order error:", err.message);
    if (err.message.includes("RAZORPAY_KEY")) {
      return res.status(500).json({ message: err.message });
    }
    res.status(500).json({ message: "Payment initiation failed: " + err.message });
  }
});

// ─── POST /api/payments/order/verify ──────────────────────────────────────
router.post("/order/verify", protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId } = req.body;

    const body     = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed." });
    }

    const order = await Order.findByIdAndUpdate(
      dbOrderId,
      { paymentStatus: "paid", razorpayPaymentId: razorpay_payment_id, status: "confirmed" },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found." });

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    res.json({ message: "Payment successful!", order });

  } catch (err) {
    console.error("Verify order error:", err.message);
    res.status(500).json({ message: "Payment verification failed: " + err.message });
  }
});

// ─── POST /api/payments/webhook ───────────────────────────────────────────
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const body      = req.body.toString();
    const expected  = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (signature !== expected) {
      return res.status(400).json({ message: "Invalid webhook signature." });
    }

    const event = JSON.parse(body);
    if (event.event === "payment.failed") {
      const { order_id } = event.payload.payment.entity;
      await Booking.findOneAndUpdate({ razorpayOrderId: order_id }, { paymentStatus: "unpaid" });
      await Order.findOneAndUpdate(   { razorpayOrderId: order_id }, { paymentStatus: "unpaid" });
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ message: "Webhook processing failed." });
  }
});

module.exports = router;
