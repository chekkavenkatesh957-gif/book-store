require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

const booksRoute = require("./routes/books");
const authRoute = require("./routes/auth");
const adminRoute = require("./routes/admin");
const ordersRoute = require("./routes/orders")
const User = require("./models/user");

const app = express();

// ========================
// Middleware
// ========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================
// MongoDB Connection
// ========================
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookstore";
mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err));

// ========================
// Static Files
// ========================
app.use(express.static(path.join(__dirname, "public")));
app.use("/admin", express.static(path.join(__dirname, "admin")));

// ========================
// API Routes
// ========================
app.use("/api/books", booksRoute);
app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoute);
app.use("/api/orders", ordersRoute);

// Get All Users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete User
app.delete("/api/users/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========================
// Website Pages
// ========================
app.get(["/", "/index", "/index.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get(["/login", "/login.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "view", "login.html"));
});

app.get(["/signup", "/signup.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "view", "signup.html"));
});

app.get(["/cart", "/cart.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "view", "cart.html"));
});

app.get(["/contact", "/contact.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "view", "contact.html"));
});

app.get(["/orders", "/orders.html", "/order-history"], (req, res) => {
  res.sendFile(path.join(__dirname, "view", "orders.html"));
});

// ========================
// Admin Pages
// ========================
app.get(["/admin", "/admin/dashboard", "/admin/dashboard.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "admin-dashboard.html"));
});

app.get(["/admin/login", "/admin/login.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "admin-login.html"));
});

app.get(["/admin/signup", "/admin/signup.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "admin-signup.html"));
});

app.get(["/admin/add-book", "/admin/add-book.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "add-book.html"));
});

app.get(["/admin/edit-book", "/admin/edit-book.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "edit-book.html"));
});

app.get(["/admin/manage-book", "/admin/manage-book.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "manage-book.html"));
});

app.get(["/admin/manage-user", "/admin/manage-user.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "manage-user.html"));
});

app.get(["/admin/orders", "/admin/orders.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "order.html"));
});

// ========================
// 404 Page (Styled HTML)
// ========================
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>404 - Page Not Found | Online Book Store</title>
      <link rel="stylesheet" href="/css/style.css">
      <style>
        body { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; background: #f8fafc; text-align: center; font-family: sans-serif; margin: 0; }
        .error-card { background: white; padding: 40px 30px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); max-width: 450px; width: 90%; border: 1px solid #e2e8f0; }
        .error-icon { font-size: 60px; margin-bottom: 15px; }
        h1 { color: #0f172a; margin: 0 0 10px 0; font-size: 28px; }
        p { color: #64748b; margin-bottom: 25px; font-size: 15px; }
        a.btn-home { display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; box-shadow: 0 4px 15px rgba(37,99,235,0.3); }
        a.btn-home:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37,99,235,0.4); }
      </style>
    </head>
    <body>
      <div class="error-card">
        <div class="error-icon">🔍</div>
        <h1>404 - Page Not Found</h1>
        <p>Sorry! The page you are looking for does not exist or has been moved.</p>
        <a href="/" class="btn-home">🏠 Return to Book Store</a>
      </div>
    </body>
    </html>
  `);
});

// ========================
// Start Server
// ========================
const PORT = process.env.PORT || 5045;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running at http://localhost:${PORT} and accessible across local network`);
  });
}

module.exports = app;