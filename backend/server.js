const express   = require("express");
const mongoose  = require("mongoose");
const cors      = require("cors");
const helmet    = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

const authLimiter    = rateLimit({ windowMs: 15*60*1000, max: 20,  message: { message: "Too many attempts." } });
const uploadLimiter  = rateLimit({ windowMs: 60*60*1000, max: 50,  message: { message: "Upload limit reached. Try again in 1 hour." } });
const aiLimiter      = rateLimit({ windowMs: 60*60*1000, max: 30,  message: { message: "AI limit reached." } });
const generalLimiter = rateLimit({ windowMs: 15*60*1000, max: 200 });

app.use("/api/auth",    authLimiter);
app.use("/api/upload",  uploadLimiter);   // rate limit uploads separately
app.use("/api/ai",      aiLimiter);
app.use("/api",         generalLimiter);
app.use(express.json({ limit: "20mb" })); // 20mb needed for base64 images
app.use(express.urlencoded({ extended: true }));

// ─── Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",      require("./routes/auth"));
app.use("/api/equipment", require("./routes/equipment"));
app.use("/api/bookings",  require("./routes/bookings"));
app.use("/api/products",  require("./routes/products"));
app.use("/api/admin",     require("./routes/admin"));
app.use("/api/payments",  require("./routes/payments"));
app.use("/api/ai",        require("./routes/ai"));
app.use("/api/weather",   require("./routes/weather"));
app.use("/api/upload",    require("./routes/upload"));    // ✅ NEW — Cloudinary uploads

app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

app.use((req, res) => res.status(404).json({ message: "Route not found." }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ message: err.message || "Internal server error." });
});

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  })
  .catch((err) => { console.error("❌ MongoDB failed:", err.message); process.exit(1); });
