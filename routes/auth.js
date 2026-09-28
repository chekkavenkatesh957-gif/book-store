const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const { users, ObjectId } = require("../models/user");

// ========================
// 1. Signup (No OTP)
// ========================
router.post("/signup", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email and password are required" });

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone ? phone.trim() : "";

    // Validate phone if provided
    if (cleanPhone && !/^\+?[\d\s\-]{7,15}$/.test(cleanPhone)) {
      return res.status(400).json({ message: "Please enter a valid phone number" });
    }

    const existingUser = await users().findOne({ email: cleanEmail });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered. Please login." });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await users().insertOne({
      name,
      email: cleanEmail,
      phone: cleanPhone,
      password: hashedPassword,
      isVerified: true,
      createdAt: new Date()
    });

    res.status(201).json({
      message: "🎉 Account created successfully! Welcome to Book Store.",
      user: { id: newUser.insertedId, name, email: cleanEmail, phone: cleanPhone }
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ========================
// 2. Login
// ========================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const cleanEmail = email.toLowerCase().trim();
    const user = await users().findOne({ email: cleanEmail });

    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    let isMatch = false;
    if (user.password && (user.password.startsWith("$2a$") || user.password.startsWith("$2b$"))) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = password === user.password;
    }

    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    res.json({
      message: "Login successful",
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone || "" }
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

module.exports = router;