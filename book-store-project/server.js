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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));
app.use("/admin", express.static(path.join(__dirname, "admin")));

(async () => {
  try {
    await connectDB();
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB init failed:", err.message);
  }
})();

app.use("/api/books", booksRoute);
app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoute);
app.use("/api/orders", ordersRoute);

app.get(["/", "/index", "/index.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get(["/login", "/login.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get(["/signup", "/signup.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup.html"));
});

const PORT = process.env.PORT || 5045;

if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;