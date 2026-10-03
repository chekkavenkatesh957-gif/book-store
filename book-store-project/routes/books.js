const express = require("express");
const router = express.Router();
const { books, ObjectId } = require("../models/book");

function getCoverImageForBook(title, category) {
  const t = (title || "").toLowerCase();
  const c = (category || "").toLowerCase();

  if (t.includes("java") && !t.includes("script")) return "java.svg";
  if (t.includes("javascript") || t.includes("js") || t.includes("typescript")) return "javascript.svg";
  if (t.includes("python")) return "python.svg";
  if (t.includes("react")) return "react.svg";
  if (t.includes("node") || t.includes("express")) return "nodejs.svg";
  if (t.includes("docker")) return "docker.svg";
  if (t.includes("kubernetes") || t.includes("k8s")) return "kubernetes.svg";
  if (t.includes("mongo")) return "mongodb.svg";
  if (t.includes("sql") || t.includes("postgres") || t.includes("mysql")) return "sql.svg";
  if (t.includes("clean code") || t.includes("clean architecture") || t.includes("clean coder")) return "cleancode.svg";
  if (t.includes("cracking") || t.includes("interview")) return "cracking.svg";
  if (t.includes("structure") || t.includes("data structure")) return "datastructures.svg";
  if (t.includes("pattern") || t.includes("design pattern")) return "designpatterns.svg";
  if (t.includes("eloquent")) return "eloquent.svg";
  if (t.includes("go ") || t.includes("golang") || t.includes("in go")) return "go.svg";
  if (t.includes("pragmatic") || t.includes("passionate programmer")) return "pragmatic.svg";
  if (t.includes("refactor")) return "refactoring.svg";
  if (t.includes("web") || t.includes("html") || t.includes("css")) return "webdev.svg";
  if (t.includes("c++")) return "cpp.svg";
  if (t.includes(" c ") || t.startsWith("c ") || t.includes("c programming")) return "c.svg";
  if (c.includes("devops") || c.includes("cloud") || t.includes("aws") || t.includes("azure")) return "devops.svg";
  if (t.includes("algorithm")) return "algorithms.svg";

  // Category fallbacks
  if (c.includes("web")) return "webdev.svg";
  if (c.includes("backend")) return "nodejs.svg";
  if (c.includes("database")) return "mongodb.svg";
  if (c.includes("cloud") || c.includes("devops")) return "devops.svg";
  if (c.includes("ai") || c.includes("ml") || c.includes("data science")) return "python.svg";
  if (c.includes("security")) return "cleancode.svg";
  if (c.includes("architecture")) return "designpatterns.svg";
  if (c.includes("cs theory") || c.includes("theory")) return "algorithms.svg";
  if (c.includes("interview")) return "cracking.svg";
  if (c.includes("mobile")) return "react.svg";
  if (c.includes("game")) return "cpp.svg";

  return "default-book.svg";
}

// Get all books
router.get("/", async (req, res) => {
  try {
    const allBooks = await books().find({}).toArray();
    const booksWithImages = allBooks.map((b) => {
      if (!b.image || b.image.trim() === "" || b.image.endsWith(".jpg") || b.image.endsWith(".png")) {
        b.image = getCoverImageForBook(b.title, b.category);
      }
      return b;
    });
    res.json(booksWithImages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new book
router.post("/", async (req, res) => {
  try {
    const bookData = { ...req.body };
    if (!bookData.image || bookData.image.trim() === "") {
      bookData.image = getCoverImageForBook(bookData.title, bookData.category);
    }
    const result = await books().insertOne(bookData);
    const newBook = { _id: result.insertedId, ...bookData };
    res.status(201).json(newBook);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a book
router.put("/:id", async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (!updateData.image || updateData.image.trim() === "") {
      updateData.image = getCoverImageForBook(updateData.title, updateData.category);
    }
    const result = await books().findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData },
      { returnDocument: "after" }
    );
    if (!result) return res.status(404).json({ message: "Book not found" });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a book
router.delete("/:id", async (req, res) => {
  try {
    const result = await books().deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Book not found" });
    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;