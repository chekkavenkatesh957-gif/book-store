require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const { connectDB, getDB, ObjectId } = require("./db/connection");

const booksRoute = require("./routes/books");
const authRoute = require("./routes/auth");
const adminRoute = require("./routes/admin");
const ordersRoute = require("./routes/orders");

const app = express();

// ========================
// Middleware
// ========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    const users = await getDB().collection("users").find({}, { projection: { password: 0 } }).toArray();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete User
app.delete("/api/users/:id", async (req, res) => {
  try {
    await getDB().collection("users").deleteOne({ _id: new ObjectId(req.params.id) });
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
// 404 Page
// ========================
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>404 - Page Not Found | Online Book Store</title>
      <style>
        body { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; background: #f8fafc; text-align: center; font-family: sans-serif; margin: 0; }
        .error-card { background: white; padding: 40px 30px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); max-width: 450px; width: 90%; }
        h1 { color: #0f172a; margin: 0 0 10px 0; font-size: 28px; }
        p { color: #64748b; margin-bottom: 25px; }
        a.btn-home { display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="error-card">
        <div style="font-size:60px">🔍</div>
        <h1>404 - Page Not Found</h1>
        <p>Sorry! The page you are looking for does not exist.</p>
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

connectDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB Atlas:", err.message);
    process.exit(1);
  });

module.exports = app;