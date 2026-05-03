const express   = require("express");
const Booking   = require("../models/Booking");
const Equipment = require("../models/Equipment");
const { uploadImages } = require("../config/cloudinary");
const { protect } = require("../middleware/auth");

const router = express.Router();

// ─── POST /api/bookings ────────────────────────────────────────────────────
router.post("/", protect, async (req, res) => {
  try {
    const { equipmentId, fromDate, toDate } = req.body;
    if (!equipmentId || !fromDate || !toDate) {
      return res.status(400).json({ message: "equipmentId, fromDate and toDate are required." });
    }

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment || !equipment.isActive) {
      return res.status(404).json({ message: "Equipment not found." });
    }
    if (equipment.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot rent your own equipment." });
    }
    if (!equipment.isDateAvailable(fromDate, toDate)) {
      return res.status(400).json({ message: "Equipment is already booked for these dates." });
    }

    const days        = Math.ceil((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24)) || 1;
    const totalAmount = days * equipment.pricePerDay;

    const booking = await Booking.create({
      equipment: equipmentId,
      renter:    req.user._id,
      owner:     equipment.owner,
      fromDate,  toDate,
      totalDays: days,
      totalAmount,
      status:    "pending",
    });

    equipment.bookedDates.push({ from: fromDate, to: toDate, bookedBy: req.user._id });
    await equipment.save();

    await booking.populate("equipment", "name pricePerDay city image");
    res.status(201).json({ booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// ─── GET /api/bookings/my ──────────────────────────────────────────────────
router.get("/my", protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ renter: req.user._id })
      .populate("equipment", "name image city pricePerDay")
      .populate("owner", "name phone shopName")
      .sort({ createdAt: -1 });
    res.json({ count: bookings.length, bookings });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ─── GET /api/bookings/incoming ───────────────────────────────────────────
router.get("/incoming", protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ owner: req.user._id })
      .populate("equipment", "name image city pricePerDay")
      .populate("renter", "name phone farmLocation")
      .sort({ createdAt: -1 });
    res.json({ count: bookings.length, bookings });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ─── GET /api/bookings/:id ─────────────────────────────────────────────────
router.get("/:id", protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("equipment")
      .populate("renter", "name phone")
      .populate("owner", "name phone shopName");
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    const isAllowed =
      booking.renter._id.toString() === req.user._id.toString() ||
      booking.owner._id.toString()  === req.user._id.toString() ||
      req.user.role === "admin";
    if (!isAllowed) return res.status(403).json({ message: "Not authorised." });
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ─── PATCH /api/bookings/:id/confirm ──────────────────────────────────────
router.patch("/:id/confirm", protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the equipment owner can confirm." });
    }
    if (booking.status !== "pending") {
      return res.status(400).json({ message: `Booking is already ${booking.status}.` });
    }
    booking.status = "confirmed";
    await booking.save();
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ─── PATCH /api/bookings/:id/cancel ───────────────────────────────────────
router.patch("/:id/cancel", protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    const isRenter = booking.renter.toString() === req.user._id.toString();
    const isOwner  = booking.owner.toString()  === req.user._id.toString();
    if (!isRenter && !isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorised." });
    }
    if (["completed","cancelled"].includes(booking.status)) {
      return res.status(400).json({ message: `Cannot cancel a ${booking.status} booking.` });
    }
    booking.status           = "cancelled";
    booking.cancelledBy      = req.user._id;
    booking.cancellationNote = req.body.note || "";
    await booking.save();
    const equipment = await Equipment.findById(booking.equipment);
    if (equipment) {
      equipment.bookedDates = equipment.bookedDates.filter(
        (d) => new Date(d.from).getTime() !== new Date(booking.fromDate).getTime()
      );
      await equipment.save();
    }
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ─── PATCH /api/bookings/:id/dispatch-photos ──────────────────────────────
// Owner uploads BEFORE handing equipment to farmer
// Accepts base64 images → uploads to Cloudinary → stores URLs in MongoDB
router.patch("/:id/dispatch-photos", protect, async (req, res) => {
  try {
    const { images, note } = req.body;

    if (!images || images.length === 0) {
      return res.status(400).json({ message: "At least one dispatch photo is required." });
    }
    if (images.length > 4) {
      return res.status(400).json({ message: "Maximum 4 dispatch photos allowed." });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the equipment owner can upload dispatch photos." });
    }
    if (booking.paymentStatus !== "paid") {
      return res.status(400).json({ message: "Booking must be paid before dispatching." });
    }

    // ✅ Upload all photos to Cloudinary, get back URLs
    const folder  = `farmlink/bookings/dispatch/${booking._id}`;
    const results = await uploadImages(images, folder);
    const urls    = results.map((r) => r.url);

    booking.dispatchPhotos = {
      images:     urls,           // Cloudinary URLs — not base64
      note:       note || "",
      uploadedAt: new Date(),
      uploadedBy: req.user._id,
    };
    booking.status = "dispatched";
    await booking.save();

    res.json({
      message: "Dispatch photos uploaded to Cloudinary. Equipment marked as dispatched.",
      booking,
    });
  } catch (err) {
    console.error("Dispatch photo error:", err);
    res.status(500).json({ message: "Photo upload failed. Please try again." });
  }
});

// ─── PATCH /api/bookings/:id/return-photos ────────────────────────────────
// Farmer uploads WHEN returning the equipment
router.patch("/:id/return-photos", protect, async (req, res) => {
  try {
    const { images, note } = req.body;

    if (!images || images.length === 0) {
      return res.status(400).json({ message: "At least one return photo is required." });
    }
    if (images.length > 4) {
      return res.status(400).json({ message: "Maximum 4 return photos allowed." });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.renter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the renter can upload return photos." });
    }
    if (booking.status !== "dispatched") {
      return res.status(400).json({ message: "Equipment must be dispatched before returning." });
    }

    // ✅ Upload to Cloudinary
    const folder  = `farmlink/bookings/return/${booking._id}`;
    const results = await uploadImages(images, folder);
    const urls    = results.map((r) => r.url);

    booking.returnPhotos = {
      images:     urls,
      note:       note || "",
      uploadedAt: new Date(),
      uploadedBy: req.user._id,
    };
    booking.status = "returned";
    await booking.save();

    res.json({
      message: "Return photos uploaded to Cloudinary. Waiting for owner to verify condition.",
      booking,
    });
  } catch (err) {
    console.error("Return photo error:", err);
    res.status(500).json({ message: "Photo upload failed. Please try again." });
  }
});

// ─── PATCH /api/bookings/:id/verify-condition ─────────────────────────────
router.patch("/:id/verify-condition", protect, async (req, res) => {
  try {
    const { conditionNote, damageReported } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the equipment owner can verify condition." });
    }
    if (booking.status !== "returned") {
      return res.status(400).json({ message: "Farmer must return the equipment first." });
    }
    booking.conditionVerified = true;
    booking.conditionNote     = conditionNote || "";
    booking.damageReported    = damageReported || false;
    booking.status            = "completed";
    await booking.save();
    res.json({
      message: damageReported
        ? "Damage reported. Please contact the renter."
        : "Condition verified. Booking completed.",
      booking,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ─── PATCH /api/bookings/:id/complete ─────────────────────────────────────
router.patch("/:id/complete", protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the equipment owner can complete." });
    }
    if (!["confirmed","dispatched","returned"].includes(booking.status)) {
      return res.status(400).json({ message: "Booking cannot be completed at this stage." });
    }
    booking.status = "completed";
    await booking.save();
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ─── POST /api/bookings/:id/review ────────────────────────────────────────
router.post("/:id/review", protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.renter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the renter can leave a review." });
    }
    if (booking.status !== "completed") {
      return res.status(400).json({ message: "Can only review completed bookings." });
    }
    if (booking.review?.rating) {
      return res.status(400).json({ message: "You have already reviewed this booking." });
    }
    booking.review = { rating, comment, createdAt: new Date() };
    await booking.save();
    const equipment = await Equipment.findById(booking.equipment);
    if (equipment) {
      const total = equipment.totalReviews + 1;
      equipment.rating       = ((equipment.rating * equipment.totalReviews) + rating) / total;
      equipment.totalReviews = total;
      await equipment.save();
    }
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
