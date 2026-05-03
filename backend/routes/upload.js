const express = require("express");
const { uploadImage, uploadImages } = require("../config/cloudinary");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Folder mapping — keeps Cloudinary organised by type
const FOLDERS = {
  equipment:       "farmlink/equipment",
  dispatch:        "farmlink/bookings/dispatch",
  return:          "farmlink/bookings/return",
  profile:         "farmlink/profiles",
};

// Helper — validate base64 image string
const isValidBase64Image = (str) => {
  if (!str || typeof str !== "string") return false;
  return str.startsWith("data:image/");
};

// Helper — check file size from base64 (approximate)
const getBase64SizeKB = (base64) => {
  const base64Data = base64.split(",")[1] || base64;
  return Math.round((base64Data.length * 3) / 4 / 1024);
};

// ─── POST /api/upload/equipment ───────────────────────────────────────────
// Upload single equipment listing photo
// Called from AddEquipmentPage when farmer/vendor selects a photo
router.post("/equipment", protect, async (req, res) => {
  try {
    const { image } = req.body;

    if (!isValidBase64Image(image)) {
      return res.status(400).json({ message: "Invalid image format. Please upload a JPG or PNG." });
    }

    // Check size — base64 of a 2MB file ≈ 2730KB in string length
    const sizeKB = getBase64SizeKB(image);
    if (sizeKB > 3000) {
      return res.status(400).json({ message: "Image is too large. Please compress it below 2MB." });
    }

    const result = await uploadImage(image, FOLDERS.equipment, {
      public_id: `equipment_${req.user._id}_${Date.now()}`,
    });

    res.json({
      url:      result.url,
      publicId: result.publicId,
      message:  "Equipment photo uploaded successfully.",
    });
  } catch (err) {
    console.error("Equipment image upload error:", err);
    res.status(500).json({ message: "Image upload failed. Please try again." });
  }
});

// ─── POST /api/upload/dispatch ────────────────────────────────────────────
// Upload dispatch condition photos (up to 4)
// Called when owner marks equipment as dispatched
router.post("/dispatch", protect, async (req, res) => {
  try {
    const { images, bookingId } = req.body;

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: "At least one photo is required." });
    }
    if (images.length > 4) {
      return res.status(400).json({ message: "Maximum 4 photos allowed." });
    }

    // Validate all images
    for (const img of images) {
      if (!isValidBase64Image(img)) {
        return res.status(400).json({ message: "One or more images are invalid." });
      }
      if (getBase64SizeKB(img) > 3000) {
        return res.status(400).json({ message: "One or more images exceed 2MB. Please compress them." });
      }
    }

    const results = await uploadImages(
      images,
      `${FOLDERS.dispatch}/${bookingId || "general"}`
    );

    res.json({
      urls:     results.map((r) => r.url),
      publicIds: results.map((r) => r.publicId),
      message:  `${results.length} dispatch photo${results.length > 1 ? "s" : ""} uploaded successfully.`,
    });
  } catch (err) {
    console.error("Dispatch photo upload error:", err);
    res.status(500).json({ message: "Photo upload failed. Please try again." });
  }
});

// ─── POST /api/upload/return ──────────────────────────────────────────────
// Upload return condition photos (up to 4)
// Called when farmer returns equipment
router.post("/return", protect, async (req, res) => {
  try {
    const { images, bookingId } = req.body;

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: "At least one photo is required." });
    }
    if (images.length > 4) {
      return res.status(400).json({ message: "Maximum 4 photos allowed." });
    }

    for (const img of images) {
      if (!isValidBase64Image(img)) {
        return res.status(400).json({ message: "One or more images are invalid." });
      }
      if (getBase64SizeKB(img) > 3000) {
        return res.status(400).json({ message: "One or more images exceed 2MB." });
      }
    }

    const results = await uploadImages(
      images,
      `${FOLDERS.return}/${bookingId || "general"}`
    );

    res.json({
      urls:      results.map((r) => r.url),
      publicIds: results.map((r) => r.publicId),
      message:   `${results.length} return photo${results.length > 1 ? "s" : ""} uploaded successfully.`,
    });
  } catch (err) {
    console.error("Return photo upload error:", err);
    res.status(500).json({ message: "Photo upload failed. Please try again." });
  }
});

module.exports = router;
