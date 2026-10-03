const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const nodemailer = require("nodemailer");
const router = express.Router();
const { users, pendingSignups } = require("../models/user");

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
let pendingSignupIndexes;

function ensurePendingSignupIndexes() {
  if (!pendingSignupIndexes) {
    pendingSignupIndexes = Promise.all([
      pendingSignups().createIndex({ email: 1 }, { unique: true }),
      pendingSignups().createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    ]);
  }
  return pendingSignupIndexes;
}

function createMailTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error("Email verification is not configured");
  }

  const port = Number(SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT is invalid");
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: SMTP_SECURE === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

async function sendVerificationCode(email, name, code) {
  const transporter = createMailTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const safeName = escapeHtml(name);

  await transporter.sendMail({
    from,
    to: email,
    subject: "Verify your Book Store email",
    text: `Hello ${name}, your verification code is ${code}. It expires in 10 minutes.`,
    html: `<p>Hello ${safeName},</p><p>Your Book Store verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>`
  });
}

router.post("/signup", async (req, res) => {
  try {
    const { name, email, phone, password, getUpdates } = req.body;
    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
    const cleanPhone = typeof phone === "string" ? phone.trim() : "";

    if (!cleanName || !cleanEmail || typeof password !== "string" || !password)
      return res.status(400).json({ message: "Name, email and password are required" });

    if (cleanName.length > 100 || cleanEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ message: "Please enter a valid name and email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (cleanPhone && !/^\+?[\d\s\-]{7,15}$/.test(cleanPhone)) {
      return res.status(400).json({ message: "Please enter a valid phone number" });
    }

    await ensurePendingSignupIndexes();

    const existingUser = await users().findOne({ email: cleanEmail });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered. Please login." });

    const existingPending = await pendingSignups().findOne({ email: cleanEmail });
    if (existingPending && existingPending.expiresAt > new Date()) {
      const resendAfterSeconds = Math.max(0, Math.ceil((existingPending.resendAllowedAt - new Date()) / 1000));
      return res.status(202).json({ message: "Signup is already pending. Enter the emailed code or resend it.", resendAfterSeconds });
    }
    if (existingPending) await pendingSignups().deleteOne({ _id: existingPending._id });

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(code, 10);
    const now = new Date();
    const pendingSignup = {
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password: hashedPassword,
      getUpdates: getUpdates !== false,
      otpHash,
      attempts: 0,
      createdAt: now,
      expiresAt: new Date(now.getTime() + OTP_TTL_MS),
      resendAllowedAt: new Date(now.getTime() + OTP_RESEND_MS)
    };

    const { insertedId } = await pendingSignups().insertOne(pendingSignup);
    try {
      await sendVerificationCode(cleanEmail, cleanName, code);
    } catch (error) {
      await pendingSignups().deleteOne({ _id: insertedId });
      console.error("Signup verification email failed:", error.message);
      return res.status(503).json({ message: "Could not send the verification email. Check your mail settings and try again." });
    }

    res.status(202).json({
      message: "Verification code sent. Check your email.",
      resendAfterSeconds: OTP_RESEND_MS / 1000
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Signup is already pending. Enter the emailed code or resend it." });
    }
    console.error("Signup failed:", err.message);
    res.status(500).json({ message: "Could not start signup. Please try again." });
  }
});

router.post("/resend-otp", async (req, res) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.toLowerCase().trim() : "";
    if (!email) return res.status(400).json({ message: "Email is required" });

    await ensurePendingSignupIndexes();
    const pending = await pendingSignups().findOne({ email });
    if (!pending || pending.expiresAt <= new Date()) {
      if (pending) await pendingSignups().deleteOne({ _id: pending._id });
      return res.status(410).json({ message: "Signup verification expired. Please submit the signup form again." });
    }

    const now = new Date();
    if (pending.resendAllowedAt > now) {
      const retryAfterSeconds = Math.ceil((pending.resendAllowedAt - now) / 1000);
      return res.status(429).json({ message: `Please wait ${retryAfterSeconds} seconds before requesting another code.`, retryAfterSeconds });
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(code, 10);
    await pendingSignups().updateOne(
      { _id: pending._id },
      {
        $set: {
          otpHash,
          attempts: 0,
          expiresAt: new Date(now.getTime() + OTP_TTL_MS),
          resendAllowedAt: new Date(now.getTime() + OTP_RESEND_MS)
        }
      }
    );

    try {
      await sendVerificationCode(pending.email, pending.name, code);
    } catch (error) {
      await pendingSignups().deleteOne({ _id: pending._id, otpHash });
      console.error("Verification email resend failed:", error.message);
      return res.status(503).json({ message: "Could not send the verification email. Please submit the signup form again." });
    }

    res.json({ message: "A new verification code was sent.", resendAfterSeconds: OTP_RESEND_MS / 1000 });
  } catch (err) {
    console.error("Verification resend failed:", err.message);
    res.status(500).json({ message: "Could not resend the verification code." });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.toLowerCase().trim() : "";
    const code = typeof req.body.code === "string" ? req.body.code.trim() : "";
    if (!email || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ message: "Enter the six-digit code sent to your email." });
    }

    await ensurePendingSignupIndexes();
    const pending = await pendingSignups().findOne({ email });
    if (!pending) return res.status(400).json({ message: "No pending signup found. Please submit the signup form again." });

    const now = new Date();
    if (pending.expiresAt <= now) {
      await pendingSignups().deleteOne({ _id: pending._id });
      return res.status(410).json({ message: "That code expired. Submit the signup form again." });
    }
    if (pending.attempts >= MAX_OTP_ATTEMPTS) {
      await pendingSignups().deleteOne({ _id: pending._id });
      return res.status(429).json({ message: "Too many incorrect codes. Please submit the signup form again." });
    }

    const codeMatches = await bcrypt.compare(code, pending.otpHash);
    if (!codeMatches) {
      const updated = await pendingSignups().findOneAndUpdate(
        { _id: pending._id, otpHash: pending.otpHash },
        { $inc: { attempts: 1 } },
        { returnDocument: "after" }
      );
      if (updated && updated.attempts >= MAX_OTP_ATTEMPTS) {
        await pendingSignups().deleteOne({ _id: pending._id, otpHash: pending.otpHash });
        return res.status(429).json({ message: "Too many incorrect codes. Please submit the signup form again." });
      }
      return res.status(400).json({ message: "Incorrect verification code." });
    }

    const claim = await pendingSignups().deleteOne({
      _id: pending._id,
      otpHash: pending.otpHash,
      expiresAt: { $gt: now },
      attempts: { $lt: MAX_OTP_ATTEMPTS }
    });
    if (claim.deletedCount !== 1) {
      return res.status(409).json({ message: "This code has already been used or expired. Request a new code." });
    }

    const existingUser = await users().findOne({ email });
    if (existingUser) return res.status(409).json({ message: "Email already registered. Please login." });

    const verifiedAt = new Date();
    const { insertedId } = await users().insertOne({
      name: pending.name,
      email: pending.email,
      phone: pending.phone,
      password: pending.password,
      getUpdates: pending.getUpdates,
      isVerified: true,
      createdAt: pending.createdAt,
      verifiedAt
    });

    res.status(201).json({
      message: "Email verified. Your account is ready.",
      user: { id: insertedId, name: pending.name, email: pending.email, phone: pending.phone || "", getUpdates: pending.getUpdates }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email already registered. Please login." });
    }
    console.error("Signup verification failed:", err.message);
    res.status(500).json({ message: "Could not verify your email. Please try again." });
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
      return res.status(403).json({ message: "Please verify your email before logging in." });
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