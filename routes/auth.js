const express = require("express");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const router = express.Router();
const User = require("../models/user");

// Transporter configuration for Gmail
const createTransporter = () => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass || user.includes("your-email") || pass.includes("your-16-digit")) {
        return null;
    }

    return nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass }
    });
};

// Helper function to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Helper to send OTP Email or print to console if unconfigured
async function sendOTPEmail(email, name, otp) {
    const transporter = createTransporter();
    const cleanEmail = email.toLowerCase().trim();

    const mailOptions = {
        from: `"Book Store" <${process.env.EMAIL_USER || 'no-reply@bookstore.com'}>`,
        to: cleanEmail,
        subject: "🔑 Your Email Verification OTP - Book Store",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <h2 style="color: #0f172a; text-align: center; margin-bottom: 10px;">📚 Book Store Email Verification</h2>
                <p style="color: #475569; font-size: 15px;">Hello <strong>${name}</strong>,</p>
                <p style="color: #475569; font-size: 15px;">Thank you for registering! Please use the following 6-digit OTP code to verify your Gmail address:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #10b981; background: #ecfdf5; padding: 12px 24px; border-radius: 8px; border: 2px dashed #10b981; display: inline-block;">${otp}</span>
                </div>
                
                <p style="color: #64748b; font-size: 13px; text-align: center;">This code will expire in <strong>10 minutes</strong>. Do not share this OTP with anyone.</p>
                <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;">
                <p style="color: #94a3b8; font-size: 12px; text-align: center;">If you did not request this code, please ignore this email.</p>
            </div>
        `
    };

    if (transporter) {
        try {
            await transporter.sendMail(mailOptions);
            console.log(`✅ Gmail OTP sent successfully to ${cleanEmail}`);
            return { sent: true };
        } catch (err) {
            console.error(`⚠️ Gmail SMTP Error (${err.message}). Printing OTP to console.`);
        }
    }

    // Fallback if SMTP not configured or failed
    console.log(`\n==================================================`);
    console.log(`🔑 [DEV GMAIL OTP]: ${otp} for ${cleanEmail}`);
    console.log(`==================================================\n`);
    return { sent: false, isDevFallback: true };
}

// =======================
// 1. Signup & Send Gmail OTP
// =======================
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields (Name, Email, Password) are required" });
        }

        const cleanEmail = email.toLowerCase().trim();

        let existingUser = await User.findOne({ email: cleanEmail });

        if (existingUser && existingUser.isVerified) {
            return res.status(400).json({ message: "This email address is already registered and verified. Please login." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        if (existingUser && !existingUser.isVerified) {
            // Update existing unverified account
            existingUser.name = name;
            existingUser.password = hashedPassword;
            existingUser.otp = otp;
            existingUser.otpExpires = otpExpires;
            await existingUser.save();
        } else {
            // Create new unverified user
            existingUser = new User({
                name,
                email: cleanEmail,
                password: hashedPassword,
                isVerified: false,
                otp,
                otpExpires
            });
            await existingUser.save();
        }

        const emailResult = await sendOTPEmail(cleanEmail, name, otp);

        res.json({
            message: emailResult.sent
                ? "OTP verification code sent to your Gmail!"
                : "OTP code generated! Check server console (or configure EMAIL_USER/EMAIL_PASS in .env for actual Gmail delivery).",
            requiresOtp: true,
            email: cleanEmail
        });

    } catch (err) {
        res.status(500).json({ message: err.message || "Server error during signup" });
    }
});

// =======================
// 2. Verify OTP
// =======================
router.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP code are required" });
        }

        const cleanEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: cleanEmail });

        if (!user) {
            return res.status(404).json({ message: "User account not found" });
        }

        if (user.isVerified) {
            return res.json({
                message: "Email is already verified. You can now login.",
                user: { id: user._id, name: user.name, email: user.email }
            });
        }

        if (!user.otp || user.otp !== otp.toString().trim()) {
            return res.status(400).json({ message: "Invalid OTP code. Please check and try again." });
        }

        if (new Date() > user.otpExpires) {
            return res.status(400).json({ message: "OTP code has expired. Please request a new code." });
        }

        // Mark as verified
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.json({
            message: "🎉 Email verified successfully! Welcome to Book Store.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (err) {
        res.status(500).json({ message: err.message || "Server error during verification" });
    }
});

// =======================
// 3. Resend OTP
// =======================
router.post("/resend-otp", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const cleanEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: cleanEmail });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "This email is already verified." });
        }

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        const emailResult = await sendOTPEmail(cleanEmail, user.name, otp);

        res.json({
            message: emailResult.sent
                ? "A new OTP has been sent to your Gmail!"
                : "New OTP code generated! Check server console."
        });

    } catch (err) {
        res.status(500).json({ message: err.message || "Error resending OTP" });
    }
});

// =======================
// 4. Login
// =======================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const cleanEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: cleanEmail });

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Check password match
        let isMatch = false;
        if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
            isMatch = await bcrypt.compare(password, user.password);
        } else {
            isMatch = (password === user.password);
        }

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Check if email is verified
        if (user.isVerified === false) {
            // Generate fresh OTP if expired or missing
            if (!user.otp || new Date() > user.otpExpires) {
                user.otp = generateOTP();
                user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
                await user.save();
                await sendOTPEmail(cleanEmail, user.name, user.otp);
            }

            return res.status(403).json({
                message: "Please verify your email address to log in. We sent an OTP to your Gmail.",
                requiresOtp: true,
                email: cleanEmail
            });
        }

        res.json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (err) {
        res.status(500).json({ message: err.message || "Server error during login" });
    }
});

module.exports = router;