const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Helper: sign a JWT
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// Helper: send token + user in response
const sendAuth = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    token,
    user: user.toSafeObject(),
  });
};

// ─── POST /api/auth/register ───────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, role, shopName, shopCity, farmLocation } = req.body;

    // Prevent registering as admin via API
    if (role === "admin") {
      return res.status(400).json({ message: "Cannot self-register as admin." });
    }

    // Check duplicate email
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    const userData = { name, email, phone, password, role: role || "farmer" };
    if (role === "vendor") {
      userData.shopName = shopName;
      userData.shopCity = shopCity;
      userData.vendorStatus = "pending";
    }
    if (role === "farmer") {
      userData.farmLocation = farmLocation;
    }

    const user = await User.create(userData);
    sendAuth(user, 201, res);
  } catch (err) {
    // Handle Mongoose validation errors
    if (err.name === "ValidationError") {
      const message = Object.values(err.errors).map((e) => e.message).join(". ");
      return res.status(400).json({ message });
    }
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // Need to explicitly select password (it's hidden by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: "Your account has been suspended. Contact support." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    sendAuth(user, 200, res);
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// ─── GET /api/auth/me ──────────────────────────────────────────────────────
// Returns the currently logged-in user from their token
router.get("/me", protect, async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

// ─── PATCH /api/auth/change-password ──────────────────────────────────────
router.patch("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new password are required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();
    sendAuth(user, 200, res);
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// ─── PATCH /api/auth/profile ───────────────────────────────────────────────
router.patch("/profile", protect, async (req, res) => {
  try {
    // Fields that are safe to update
    const allowed = ["name", "phone", "farmLocation", "shopName", "shopCity", "soilType", "language"];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined && req.body[field] !== "") updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });
 
    const user = await User.findOne({ email: email.toLowerCase() });
 
    // Always return success — don't reveal whether email exists
    if (!user) {
      return res.json({ message: "If an account with that email exists, a reset link has been sent." });
    }
 
    // Generate a secure random token
    const crypto = require("crypto");
    const token  = crypto.randomBytes(32).toString("hex");
 
    user.resetPasswordToken   = token;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });
 
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
 
    // Send email
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
 
    await transporter.sendMail({
      from: `"FarmLink" <${process.env.EMAIL_USER}>`,
      to:   user.email,
      subject: "Reset your FarmLink password",
      html: `
        <div style="font-family: 'DM Sans', sans-serif; max-width: 500px; margin: 0 auto; padding: 2rem; background: #F7F6F3; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 1.5rem;">
            <div style="display: inline-block; background: #1C3A0E; padding: 12px 20px; border-radius: 10px;">
              <span style="color: white; font-size: 20px; font-weight: bold;">🌱 FarmLink</span>
            </div>
          </div>
          <h2 style="color: #1a1a1a; margin-bottom: 8px;">Reset your password</h2>
          <p style="color: #555; margin-bottom: 1.5rem;">Hi ${user.name}, we received a request to reset your FarmLink password. Click the button below to set a new password.</p>
          <a href="${resetUrl}" style="display: block; text-align: center; background: #3B6D11; color: white; padding: 14px 24px; border-radius: 10px; text-decoration: none; font-weight: 500; font-size: 15px; margin-bottom: 1.5rem;">
            Reset Password
          </a>
          <p style="color: #888; font-size: 12px; text-align: center;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
          <p style="color: #AAA; font-size: 11px; text-align: center; margin-top: 1rem;">Or copy this link: ${resetUrl}</p>
        </div>
      `,
    });
 
    res.json({ message: "If an account with that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Could not send reset email. Please try again." });
  }
});
 
// ─── POST /api/auth/reset-password/:token ─────────────────────────────────
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }
 
    const user = await User.findOne({
      resetPasswordToken:   req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });
 
    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or has expired." });
    }
 
    user.password             = password;
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
 
    sendAuth(user, 200, res);
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

module.exports = router;