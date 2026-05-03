const express = require("express");
const Product = require("../models/Product");
const { protect, vendorApproved } = require("../middleware/auth");

const router = express.Router();

// ─── GET /api/products ─────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { category, city, minPrice, maxPrice, search } = req.query;
    const filter = { isActive: true, stock: { $gt: 0 } };

    if (category) filter.category = category;
    if (city)     filter.city     = new RegExp(city, "i");
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) {
      filter.$or = [
        { name:        new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
      ];
    }

    const products = await Product.find(filter)
      .populate("seller", "name phone shopName city")
      .sort({ createdAt: -1 });

    res.json({ count: products.length, products });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ─── GET /api/products/:id ─────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("seller", "name phone shopName city rating");
    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not found." });
    }
    res.json({ product });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ─── POST /api/products ────────────────────────────────────────────────────
router.post("/", protect, vendorApproved, async (req, res) => {
  try {
    const { name, description, category, price, unit, stock, city, images } = req.body;
    const product = await Product.create({
      name, description, category, price, unit, stock, city, images,
      seller:     req.user._id,
      sellerType: req.user.role === "vendor" ? "vendor" : "farmer",
    });
    res.status(201).json({ product });
  } catch (err) {
    if (err.name === "ValidationError") {
      const message = Object.values(err.errors).map((e) => e.message).join(". ");
      return res.status(400).json({ message });
    }
    res.status(500).json({ message: "Server error." });
  }
});

// ─── PATCH /api/products/:id ───────────────────────────────────────────────
router.patch("/:id", protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorised." });
    }
    const allowed = ["name", "description", "price", "stock", "unit", "city", "images", "isActive"];
    allowed.forEach((f) => { if (req.body[f] !== undefined) product[f] = req.body[f]; });
    await product.save();
    res.json({ product });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ─── DELETE /api/products/:id ──────────────────────────────────────────────
router.delete("/:id", protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorised." });
    }
    product.isActive = false;
    await product.save();
    res.json({ message: "Product removed." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ─── GET /api/products/my/listings ────────────────────────────────────────
router.get("/my/listings", protect, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id, isActive: true })
      .sort({ createdAt: -1 });
    res.json({ count: products.length, products });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
