const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify token and attach user to req
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authenticated. Please log in." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or deactivated." });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
    return res.status(401).json({ message: "Invalid token." });
  }
};

// Restrict to specific roles
// Usage: router.get("/admin-only", protect, restrictTo("admin"), handler)
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You do not have permission for this action." });
  }
  next();
};

// Vendor must be approved
const vendorApproved = (req, res, next) => {
  if (req.user.role === "vendor" && req.user.vendorStatus !== "approved") {
    return res.status(403).json({ message: "Your vendor account is pending admin approval." });
  }
  next();
};

module.exports = { protect, restrictTo, vendorApproved };
