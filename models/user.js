const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        unique: true
    },
    password: String,
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: String,
    otpExpires: Date,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    phone: String
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);