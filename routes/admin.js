const express = require("express");
const router = express.Router();
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");

// ========================
// Admin API Routes
// ========================

// Admin Signup API
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existing = await Admin.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: "Admin with this email already exists" });
        }

        const admin = new Admin({ name, email, password });
        await admin.save();

        res.status(201).json({ message: "Admin account created successfully" });
    } catch (err) {
        console.error("Admin Signup Error:", err.message);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

// Admin Login API
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

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

// ========================
// Admin Page Routes
// ========================

// Admin Login Page
router.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "../admin/admin-login.html"));
});

// Admin Signup Page
router.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, "../admin/admin-signup.html"));
});

// Dashboard
router.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "../admin/admin-dashboard.html"));
});

// Add Book
router.get("/add-book", (req, res) => {
    res.sendFile(path.join(__dirname, "../admin/add-book.html"));
});

// Edit Book
router.get("/edit-book", (req, res) => {
    res.sendFile(path.join(__dirname, "../admin/edit-book.html"));
});

// Manage Books
router.get("/manage-book", (req, res) => {
    res.sendFile(path.join(__dirname, "../admin/manage-book.html"));
});

// Manage Users
router.get("/manage-user", (req, res) => {
    res.sendFile(path.join(__dirname, "../admin/manage-user.html"));
});

// Orders
router.get("/orders", (req, res) => {
    res.sendFile(path.join(__dirname, "../admin/order.html"));
});

module.exports = router;
