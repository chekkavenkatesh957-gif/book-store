const express = require("express");
const router = express.Router();
const Order = require("../models/order");

// Get all orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get orders for a specific user email
router.get("/user/:email", async (req, res) => {
  try {
    const orders = await Order.find({ 
      customerEmail: { $regex: new RegExp(`^${req.params.email}$`, "i") } 
    }).sort({ createdAt: -1 });
    res.json(orders);
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

    const order = new Order({
      customerName: req.body.customerName,
      customerEmail: req.body.customerEmail,
      items: req.body.items,
      totalAmount: req.body.totalAmount,
      deliveryAddress: deliveryAddress,
      status: "Pending"
    });

    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update order status
router.put("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete order
router.delete("/:id", async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;