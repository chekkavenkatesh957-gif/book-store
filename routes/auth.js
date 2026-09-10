const express = require("express");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const router = express.Router();
const { users, ObjectId } = require("../models/user");

// Transporter configuration for Gmail
const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass || user.includes("your-email") || pass.includes("your-16-digit")) return null;
  return nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

async function sendOTPEmail(email, name, otp) {
  const transporter = createTransporter();
  const cleanEmail = email.toLowerCase().trim();

  const mailOptions = {
    from: `"Book Store" <${process.env.EMAIL_USER || "no-reply@bookstore.com"}>`,
    to: cleanEmail,
    subject: "🔑 Your Email Verification OTP - Book Store",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #0f172a; text-align: center;">📚 Book Store Email Verification</h2>
        <p style="color: #475569;">Hello <strong>${name}</strong>,</p>
        <p style="color: #475569;">Use this OTP to verify your email:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #10b981; background: #ecfdf5; padding: 12px 24px; border-radius: 8px; border: 2px dashed #10b981; display: inline-block;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px; text-align: center;">Expires in <strong>10 minutes</strong>. Do not share this OTP.</p>
      </div>
    `
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ OTP sent to ${cleanEmail}`);
      return { sent: true };
    } catch (err) {
      console.error(`⚠️ SMTP Error: ${err.message}`);
    }
  }

  console.log(`\n==================================================`);
  console.log(`🔑 [DEV OTP]: ${otp} for ${cleanEmail}`);
  console.log(`==================================================\n`);
  return { sent: false, isDevFallback: true };
}

// ========================
// 1. Signup & Send OTP
// ========================
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await users().findOne({ email: cleanEmail });

    if (existingUser && existingUser.isVerified)
      return res.status(400).json({ message: "Email already registered. Please login." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    if (existingUser && !existingUser.isVerified) {
      await users().updateOne(
        { _id: existingUser._id },
        { $set: { name, password: hashedPassword, otp, otpExpires } }
      );
    } else {
      await users().insertOne({
        name,
        email: cleanEmail,
        password: hashedPassword,
        isVerified: false,
        otp,
        otpExpires
      });
    }

    const emailResult = await sendOTPEmail(cleanEmail, name, otp);
    res.json({
      message: emailResult.sent
        ? "OTP sent to your Gmail!"
        : "OTP generated! Check server console.",
      requiresOtp: true,
      email: cleanEmail
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ========================
// 2. Verify OTP
// ========================
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

    const cleanEmail = email.toLowerCase().trim();
    const user = await users().findOne({ email: cleanEmail });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified)
      return res.json({ message: "Already verified. Please login.", user: { id: user._id, name: user.name, email: user.email } });
    if (!user.otp || user.otp !== otp.toString().trim())
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    if (new Date() > user.otpExpires)
      return res.status(400).json({ message: "OTP expired. Request a new one." });

    await users().updateOne(
      { _id: user._id },
      { $set: { isVerified: true }, $unset: { otp: "", otpExpires: "" } }
    );

    res.json({
      message: "🎉 Email verified! Welcome to Book Store.",
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ========================
// 3. Resend OTP
// ========================
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const cleanEmail = email.toLowerCase().trim();
    const user = await users().findOne({ email: cleanEmail });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "Email already verified." });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await users().updateOne({ _id: user._id }, { $set: { otp, otpExpires } });

    const emailResult = await sendOTPEmail(cleanEmail, user.name, otp);
    res.json({
      message: emailResult.sent ? "New OTP sent to your Gmail!" : "New OTP generated! Check console."
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Error resending OTP" });
  }
});

// ========================
// 4. Login
// ========================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const cleanEmail = email.toLowerCase().trim();
    const user = await users().findOne({ email: cleanEmail });

    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    let isMatch = false;
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = password === user.password;
    }

    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    if (user.isVerified === false) {
      if (!user.otp || new Date() > user.otpExpires) {
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await users().updateOne({ _id: user._id }, { $set: { otp, otpExpires } });
        await sendOTPEmail(cleanEmail, user.name, otp);
      }
      return res.status(403).json({
        message: "Please verify your email. OTP sent to your Gmail.",
        requiresOtp: true,
        email: cleanEmail
      });
    }

    res.json({
      message: "Login successful",
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

module.exports = router;