const express = require("express");
const User      = require("../models/User");
const Equipment = require("../models/Equipment");
const Booking   = require("../models/Booking");
const Product   = require("../models/Product");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

// All admin routes require login + admin role
router.use(protect, restrictTo("admin"));

// ─── GET /api/admin/stats ──────────────────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const [
      totalUsers, totalFarmers, totalVendors, pendingVendors,
      totalEquipment, totalBookings, totalProducts,
      recentBookings,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: "farmer", isActive: true }),
      User.countDocuments({ role: "vendor", vendorStatus: "approved" }),
      User.countDocuments({ role: "vendor", vendorStatus: "pending" }),
      Equipment.countDocuments({ isActive: true }),
      Booking.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Booking.find().sort({ createdAt: -1 }).limit(5)
        .populate("renter", "name")
        .populate("equipment", "name"),
    ]);

    res.json({
      users: { total: totalUsers, farmers: totalFarmers, vendors: totalVendors, pendingVendors },
      equipment: totalEquipment,
      bookings: totalBookings,
      products: totalProducts,
      recentBookings,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ─── GET /api/admin/vendors/pending ───────────────────────────────────────
router.get("/vendors/pending", async (req, res) => {
  try {
    const vendors = await User.find({ role: "vendor", vendorStatus: "pending" })
      .sort({ createdAt: -1 });
    res.json({ count: vendors.length, vendors });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ─── PATCH /api/admin/vendors/:id/approve ─────────────────────────────────
router.patch("/vendors/:id/approve", async (req, res) => {
  try {
    const vendor = await User.findOneAndUpdate(
      { _id: req.params.id, role: "vendor" },
      { vendorStatus: "approved" },
      { new: true }
    );
    if (!vendor) return res.status(404).json({ message: "Vendor not found." });
    res.json({ message: `${vendor.name} approved as vendor.`, vendor });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ─── PATCH /api/admin/vendors/:id/reject ──────────────────────────────────
router.patch("/vendors/:id/reject", async (req, res) => {
  try {
    const vendor = await User.findOneAndUpdate(
      { _id: req.params.id, role: "vendor" },
      { vendorStatus: "rejected" },
      { new: true }
    );
    if (!vendor) return res.status(404).json({ message: "Vendor not found." });
    res.json({ message: `${vendor.name} rejected.`, vendor });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ─── GET /api/admin/users ──────────────────────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};
    if (role)   filter.role = role;
    if (search) filter.$or  = [
      { name:  new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
    ];
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json({ count: users.length, users });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ─── PATCH /api/admin/users/:id/suspend ───────────────────────────────────
router.patch("/users/:id/suspend", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ message: `${user.name} suspended.` });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ─── DELETE /api/admin/listings/:id ───────────────────────────────────────
router.delete("/listings/:id", async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!equipment) return res.status(404).json({ message: "Listing not found." });
    res.json({ message: "Listing removed by admin." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
