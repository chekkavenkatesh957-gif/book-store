const express = require("express");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const router = express.Router();
const { users, ObjectId } = require("../models/user");
const { getDB } = require("../db/connection");
const crypto = require("crypto");

const OTP_LIFETIME_MS = 10 * 60 * 1000;
const OTP_RESEND_DELAY_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
let otpIndexPromise;

const verificationOtps = () => getDB().collection("emailVerificationOtps");

async function ensureOtpExpiryIndex() {
  if (!otpIndexPromise) {
    otpIndexPromise = verificationOtps()
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
      .catch((error) => {
        otpIndexPromise = null;
        throw error;
      });
  }
  return otpIndexPromise;
}

function createMailTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass || !Number.isInteger(port)) {
    const error = new Error("Email OTP is not configured");
    error.code = "SMTP_NOT_CONFIGURED";
    throw error;
  }

  return {
    transport: nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === "true" || port === 465,
      auth: { user, pass }
    }),
    from: process.env.SMTP_FROM || user
  };
}

function createOtp() {
  return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
}

async function deliverOtp(email, code) {
  const { transport, from } = createMailTransport();
  await transport.sendMail({
    from,
    to: email,
    subject: "Your Book Store verification code",
    text: `Your email verification code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
    html: `<p>Your Book Store verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:8px">${code}</p><p>This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>`
  });
}

function emailUnavailable(res) {
  return res.status(503).json({
    message: "Email verification is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM on the server."
  });
}

router.post("/signup", async (req, res) => {
  try {
    const { name, email, phone, password, getUpdates } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const cleanPhone = phone ? phone.trim() : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (cleanPhone && !/^\+?[\d\s\-]{7,15}$/.test(cleanPhone)) {
      return res.status(400).json({ message: "Please enter a valid phone number" });
    }

    const existingUser = await users().findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered. Please login." });
    }

    const collection = verificationOtps();
    await ensureOtpExpiryIndex();
    const previous = await collection.findOne({ email: cleanEmail });
    const now = new Date();
    if (previous && previous.expiresAt > now && now - previous.lastSentAt < OTP_RESEND_DELAY_MS) {
      return res.status(429).json({ message: "A code was just sent. Please wait a minute before requesting another." });
    }

    const code = createOtp();
    const otpHash = await bcrypt.hash(code, 10);
    const verification = {
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password: await bcrypt.hash(password, 10),
      getUpdates: Boolean(getUpdates),
      otpHash,
      attempts: 0,
      lastSentAt: now,
      expiresAt: new Date(now.getTime() + OTP_LIFETIME_MS)
    };

    await collection.updateOne(
      { email: cleanEmail },
      { $set: verification },
      { upsert: true }
    );

    try {
      await deliverOtp(cleanEmail, code);
    } catch (error) {
      await collection.deleteOne({ email: cleanEmail, otpHash });
      if (error.code === "SMTP_NOT_CONFIGURED") return emailUnavailable(res);
      console.error("OTP email delivery failed:", error.message);
      return res.status(503).json({ message: "Could not send the verification email. Check the SMTP settings and try again." });
    }

    return res.status(200).json({
      message: "A verification code has been sent to your email address.",
      email: cleanEmail
    });
  } catch (err) {
    console.error("Signup OTP error:", err.message);
    res.status(500).json({ message: "Could not start email verification. Please try again." });
  }
});

router.post("/resend-otp", async (req, res) => {
  try {
    const cleanEmail = String(req.body.email || "").toLowerCase().trim();
    if (!cleanEmail) return res.status(400).json({ message: "Email is required" });

    const collection = verificationOtps();
    await ensureOtpExpiryIndex();
    const verification = await collection.findOne({ email: cleanEmail });
    if (!verification || verification.expiresAt <= new Date()) {
      return res.status(400).json({ message: "Verification expired. Please submit the signup form again." });
    }
    const remaining = OTP_RESEND_DELAY_MS - (Date.now() - verification.lastSentAt.getTime());
    if (remaining > 0) {
      return res.status(429).json({ message: `Please wait ${Math.ceil(remaining / 1000)} seconds before requesting another code.` });
    }

    const code = createOtp();
    const otpHash = await bcrypt.hash(code, 10);
    const lastSentAt = new Date();
    await collection.updateOne(
      { _id: verification._id },
      {
        $set: {
          otpHash,
          attempts: 0,
          lastSentAt,
          expiresAt: new Date(lastSentAt.getTime() + OTP_LIFETIME_MS)
        }
      }
    );

    try {
      await deliverOtp(cleanEmail, code);
    } catch (error) {
      await collection.deleteOne({ _id: verification._id, otpHash });
      if (error.code === "SMTP_NOT_CONFIGURED") return emailUnavailable(res);
      console.error("OTP email delivery failed:", error.message);
      return res.status(503).json({ message: "Could not send the verification email. Please submit the signup form again." });
    }

    return res.json({ message: "A new verification code has been sent." });
  } catch (err) {
    console.error("OTP resend error:", err.message);
    res.status(500).json({ message: "Could not resend the verification code. Please try again." });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const cleanEmail = String(req.body.email || "").toLowerCase().trim();
    const code = String(req.body.code || "").trim();
    if (!cleanEmail || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ message: "Enter the six-digit code sent to your email" });
    }

    const collection = verificationOtps();
    await ensureOtpExpiryIndex();
    const verification = await collection.findOne({ email: cleanEmail });
    if (!verification || verification.expiresAt <= new Date()) {
      return res.status(400).json({ message: "Verification code expired. Please submit the signup form again." });
    }
    if (verification.attempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ message: "Too many incorrect attempts. Request a new code." });
    }

    const attempt = await collection.updateOne(
      { _id: verification._id, attempts: { $lt: OTP_MAX_ATTEMPTS } },
      { $inc: { attempts: 1 } }
    );
    if (attempt.modifiedCount !== 1) {
      return res.status(429).json({ message: "Too many incorrect attempts. Request a new code." });
    }

    if (!(await bcrypt.compare(code, verification.otpHash))) {
      const attemptsLeft = OTP_MAX_ATTEMPTS - verification.attempts - 1;
      return res.status(400).json({ message: `Incorrect code. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining.` });
    }

    const claim = await collection.deleteOne({ _id: verification._id });
    if (claim.deletedCount !== 1) {
      return res.status(400).json({ message: "This code has already been used. Request a new code." });
    }

    const newUser = await users().insertOne({
      name: verification.name,
      email: verification.email,
      phone: verification.phone,
      password: verification.password,
      getUpdates: verification.getUpdates,
      isVerified: true,
      createdAt: new Date()
    });

    return res.status(201).json({
      message: "Email verified and account created successfully.",
      user: {
        id: newUser.insertedId,
        name: verification.name,
        email: verification.email,
        phone: verification.phone || ""
      }
    });
  } catch (err) {
    console.error("OTP verification error:", err.message);
    res.status(500).json({ message: "Could not verify the code. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const cleanEmail = email.toLowerCase().trim();
    const user = await users().findOne({ email: cleanEmail });

    if (!user) return res.status(400).json({ message: "Invalid email or password" });
    if (user.isVerified === false) {
      return res.status(403).json({ message: "Please verify your email address before logging in." });
    }

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