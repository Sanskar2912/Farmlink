const express   = require("express");
const Equipment = require("../models/Equipment");
const { uploadImage, deleteImage } = require("../config/cloudinary");
const { protect, vendorApproved } = require("../middleware/auth");

const router = express.Router();

// ─── GET /api/equipment ─────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { category, city, minPrice, maxPrice, ownerType, search } = req.query;
    const filter = { isActive: true, isAvailable: true };
    if (category)  filter.category  = category;
    if (city)      filter.city      = new RegExp(city, "i");
    if (ownerType) filter.ownerType = ownerType;
    if (minPrice || maxPrice) {
      filter.pricePerDay = {};
      if (minPrice) filter.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerDay.$lte = Number(maxPrice);
    }
    if (search) {
      filter.$or = [
        { name:        new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
        { city:        new RegExp(search, "i") },
      ];
    }

    const equipment = await Equipment.find(filter)
      .populate("owner", "name phone city shopName")
      .sort({ createdAt: -1 });

    res.json({ count: equipment.length, equipment });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ─── GET /api/equipment/my/listings ────────────────────────────────────
router.get("/my/listings", protect, async (req, res) => {
  try {
    const equipment = await Equipment.find({ owner: req.user._id, isActive: true })
      .sort({ createdAt: -1 });
    res.json({ count: equipment.length, equipment });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ─── GET /api/equipment/:id ─────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate("owner", "name phone city shopName rating");
    if (!equipment || !equipment.isActive) {
      return res.status(404).json({ message: "Equipment not found." });
    }
    res.json({ equipment });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ─── POST /api/equipment ────────────────────────────────────────────────
// Frontend sends `image` as a base64 string OR a Cloudinary URL
// If it's base64 → upload to Cloudinary here
// If it's already a URL (starts with https) → store directly
router.post("/", protect, vendorApproved, async (req, res) => {
  try {
    const { name, description, category, pricePerDay, city, state, pincode, image } = req.body;

    if (!image) {
      return res.status(400).json({ message: "Please upload a photo of the equipment." });
    }

    let imageUrl      = null;
    let imagePublicId = null;

    // If base64 → upload to Cloudinary
    if (image.startsWith("data:image/")) {
      const result  = await uploadImage(image, "farmlink/equipment", {
        public_id: `equipment_${req.user._id}_${Date.now()}`,
      });
      imageUrl      = result.url;
      imagePublicId = result.publicId;
    } else if (image.startsWith("https://")) {
      // Already a Cloudinary URL (uploaded separately via /api/upload/equipment)
      imageUrl = image;
    } else {
      return res.status(400).json({ message: "Invalid image format." });
    }

    const equipment = await Equipment.create({
      name, description, category, pricePerDay,
      city, state, pincode,
      image:          imageUrl,        // store the Cloudinary URL
      imagePublicId,                   // store publicId for future deletion
      owner:          req.user._id,
      ownerType:      req.user.role === "vendor" ? "vendor" : "farmer",
    });

    res.status(201).json({ equipment });
  } catch (err) {
    if (err.name === "ValidationError") {
      const message = Object.values(err.errors).map((e) => e.message).join(". ");
      return res.status(400).json({ message });
    }
    res.status(500).json({ message: "Server error." });
  }
});

// ─── PATCH /api/equipment/:id ───────────────────────────────────────────
router.patch("/:id", protect, async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) return res.status(404).json({ message: "Equipment not found." });
    if (equipment.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorised." });
    }

    // If a new image is being uploaded
    if (req.body.image && req.body.image.startsWith("data:image/")) {
      // Delete old image from Cloudinary
      if (equipment.imagePublicId) {
        await deleteImage(equipment.imagePublicId);
      }
      // Upload new image
      const result = await uploadImage(req.body.image, "farmlink/equipment");
      equipment.image          = result.url;
      equipment.imagePublicId  = result.publicId;
      delete req.body.image; // don't overwrite with base64
    }

    const allowed = ["name", "description", "category", "pricePerDay", "city", "state", "pincode", "isAvailable"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) equipment[field] = req.body[field];
    });

    await equipment.save();
    res.json({ equipment });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ─── DELETE /api/equipment/:id ──────────────────────────────────────────
router.delete("/:id", protect, async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) return res.status(404).json({ message: "Equipment not found." });
    if (equipment.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorised." });
    }

    // Soft delete — don't delete Cloudinary image (keeps booking history photos valid)
    equipment.isActive = false;
    await equipment.save();
    res.json({ message: "Listing removed successfully." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ─── GET /api/equipment/:id/availability ───────────────────────────────
router.get("/:id/availability", async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ message: "from and to dates required." });
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) return res.status(404).json({ message: "Equipment not found." });
    const available = equipment.isDateAvailable(from, to);
    const days = Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)) || 1;
    res.json({
      available,
      totalDays:   days,
      totalAmount: available ? days * equipment.pricePerDay : null,
      message:     available ? "Available for selected dates." : "Already booked for these dates.",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
