const express = require("express");
const router = express.Router();
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { admins, ObjectId } = require("../models/admin");

// Admin Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const existing = await admins().findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Admin with this email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await admins().insertOne({ name, email, password: hashedPassword, createdAt: new Date() });

    res.status(201).json({ message: "Admin account created successfully" });
  } catch (err) {
    console.error("Admin Signup Error:", err.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// Admin Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const admin = await admins().findOne({ email });
    if (!admin)
      return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET || "adminSecretKey123",
      { expiresIn: "1d" }
    );

    res.json({ message: "Login successful", token, name: admin.name });
  } catch (err) {
    console.error("Admin Login Error:", err.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// Admin Pages
router.get("/login", (req, res) => res.sendFile(path.join(__dirname, "../admin/admin-login.html")));
router.get("/signup", (req, res) => res.sendFile(path.join(__dirname, "../admin/admin-signup.html")));
router.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "../admin/admin-dashboard.html")));
router.get("/add-book", (req, res) => res.sendFile(path.join(__dirname, "../admin/add-book.html")));
router.get("/edit-book", (req, res) => res.sendFile(path.join(__dirname, "../admin/edit-book.html")));
router.get("/manage-book", (req, res) => res.sendFile(path.join(__dirname, "../admin/manage-book.html")));
router.get("/manage-user", (req, res) => res.sendFile(path.join(__dirname, "../admin/manage-user.html")));
router.get("/orders", (req, res) => res.sendFile(path.join(__dirname, "../admin/order.html")));

module.exports = router;
