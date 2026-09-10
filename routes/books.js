const express = require("express");
const router = express.Router();
const { books, ObjectId } = require("../models/book");

// Get all books
router.get("/", async (req, res) => {
  try {
    const allBooks = await books().find({}).toArray();
    res.json(allBooks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new book
router.post("/", async (req, res) => {
  try {
    const result = await books().insertOne(req.body);
    const newBook = { _id: result.insertedId, ...req.body };
    res.status(201).json(newBook);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a book
router.put("/:id", async (req, res) => {
  try {
    const result = await books().findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body },
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