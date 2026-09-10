const express = require("express");
const router = express.Router();
const { orders, ObjectId } = require("../models/order");

// Get all orders
router.get("/", async (req, res) => {
  try {
    const allOrders = await orders().find({}).sort({ createdAt: -1 }).toArray();
    res.json(allOrders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get orders for a specific user email
router.get("/user/:email", async (req, res) => {
  try {
    const userOrders = await orders()
      .find({ customerEmail: { $regex: new RegExp(`^${req.params.email}$`, "i") } })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(userOrders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Place a new order
router.post("/", async (req, res) => {
  try {
    const deliveryAddress = req.body.deliveryAddress || {
      street: req.body.street || "",
      city: req.body.city || "",
      state: req.body.state || "",
      zipCode: req.body.zipCode || "",
      phone: req.body.phone || "",
      fullAddress: req.body.fullAddress || ""
    };

    const newOrder = {
      customerName: req.body.customerName,
      customerEmail: req.body.customerEmail,
      items: req.body.items,
      totalAmount: req.body.totalAmount,
      deliveryAddress,
      status: "Pending",
      paymentMethod: req.body.paymentMethod || "Cash on Delivery",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await orders().insertOne(newOrder);
    res.status(201).json({ _id: result.insertedId, ...newOrder });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update order status
router.put("/:id", async (req, res) => {
  try {
    const result = await orders().findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: req.body.status, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete order
router.delete("/:id", async (req, res) => {
  try {
    await orders().deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;