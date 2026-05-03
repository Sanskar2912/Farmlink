/**
 * FarmLink — Create Admin Account
 * 
 * Run this ONCE from the backend folder:
 *   node createAdmin.js
 * 
 * Then DELETE this file immediately after running.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User     = require("./models/User");

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log("✅ Connected to MongoDB");

  // Check if admin already exists
  const existing = await User.findOne({ role: "admin" });
  if (existing) {
    console.log("⚠️  Admin already exists:");
    console.log("   Name: ", existing.name);
    console.log("   Email:", existing.email);
    console.log("   Role: ", existing.role);
    console.log("\nIf you want to create another admin, delete the existing one first.");
    process.exit(0);
  }

  // Create admin
  const admin = await User.create({
    name:     "FarmLink Admin",
    email:    "admin@farmlink.com",
    phone:    "9999999999",
    password: "Admin@1234",
    role:     "admin",
    isActive: true,
    language: "en",
  });

  console.log("\n✅ Admin account created successfully!");
  console.log("─────────────────────────────────────");
  console.log("   Email:    admin@farmlink.com");
  console.log("   Password: Admin@1234");
  console.log("   Role:     admin");
  console.log("─────────────────────────────────────");
  console.log("\n⚠️  IMPORTANT: Delete this file (createAdmin.js) now!");
  console.log("   Then log in at http://localhost:5173\n");

  process.exit(0);
}).catch((err) => {
  console.error("❌ Failed to connect to MongoDB:", err.message);
  console.error("   Make sure your .env file has the correct MONGODB_URI");
  process.exit(1);
});
