const express = require("express");
const router = express.Router();
const { orders, ObjectId } = require("../models/order");

function buildOrderQuery(id) {
  if (!id) return { _id: null };
  if (ObjectId.isValid(id) && String(new ObjectId(id)) === String(id)) {
    return { $or: [{ _id: new ObjectId(id) }, { _id: id }] };
  }
  return { _id: id };
}

// Get all orders (with optional search & filter)
router.get("/", async (req, res) => {
  try {
    const filter = {};
    const { status, paymentStatus, search } = req.query;

    if (status && status !== "ALL") {
      filter.status = status;
    }
    if (paymentStatus && paymentStatus !== "ALL") {
      filter.paymentStatus = paymentStatus;
    }
    if (search && search.trim()) {
      const s = search.trim();
      filter.$or = [
        { customerName: { $regex: s, $options: "i" } },
        { customerEmail: { $regex: s, $options: "i" } },
        { utrNumber: { $regex: s, $options: "i" } },
        { transactionId: { $regex: s, $options: "i" } },
        { "deliveryAddress.phone": { $regex: s, $options: "i" } }
      ];
    }

    const allOrders = await orders().find(filter).sort({ createdAt: -1 }).toArray();
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

// Get single order by ID
router.get("/:id", async (req, res) => {
  try {
    const order = await orders().findOne(buildOrderQuery(req.params.id));
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
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

    const paymentMethod = req.body.paymentMethod || "PhonePe UPI (6302458954@ybl)";
    const utrNumber = String(req.body.utrNumber || req.body.transactionId || "").trim();
    const isCod = paymentMethod.toLowerCase().includes("cash on delivery") || paymentMethod.toLowerCase().includes("cod");

    // Initial payment & order status
    let paymentStatus = "Pending Verification";
    let status = "Awaiting Verification";

    if (isCod) {
      paymentStatus = "Unpaid (Cash on Delivery)";
      status = "Pending";
    }

    if (req.body.paymentStatus) paymentStatus = req.body.paymentStatus;
    if (req.body.status) status = req.body.status;

    const newOrder = {
      customerName: req.body.customerName || "Customer",
      customerEmail: req.body.customerEmail || "",
      items: req.body.items || [],
      totalAmount: req.body.totalAmount || 0,
      deliveryAddress,
      paymentMethod,
      utrNumber: utrNumber,
      transactionId: utrNumber,
      paymentStatus,
      status,
      adminNote: req.body.adminNote || "",
      verifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await orders().insertOne(newOrder);
    res.status(201).json({ _id: result.insertedId, ...newOrder });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update order (status, paymentStatus, adminNote, etc.)
router.put("/:id", async (req, res) => {
  try {
    const updateData = { updatedAt: new Date() };

    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.paymentStatus !== undefined) updateData.paymentStatus = req.body.paymentStatus;
    if (req.body.adminNote !== undefined) updateData.adminNote = req.body.adminNote;
    if (req.body.utrNumber !== undefined) {
      updateData.utrNumber = String(req.body.utrNumber).trim();
      updateData.transactionId = String(req.body.utrNumber).trim();
    }

    if (req.body.paymentStatus === "Verified & Approved" || req.body.status === "Processing") {
      updateData.verifiedAt = new Date();
    }

    const query = buildOrderQuery(req.params.id);
    const result = await orders().findOneAndUpdate(
      query,
      { $set: updateData },
      { returnDocument: "after" }
    );
    if (!result) return res.status(404).json({ message: "Order not found" });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Quick action: verify payment (Approve or Reject)
router.put("/:id/verify-payment", async (req, res) => {
  try {
    const { action, adminNote } = req.body; // 'approve' or 'reject'
    const updateData = { updatedAt: new Date() };

    if (action === "approve") {
      updateData.paymentStatus = "Verified & Approved";
      updateData.status = "Processing"; // Order confirmed and moving to processing
      updateData.verifiedAt = new Date();
      updateData.adminNote = adminNote || "Payment verified against PhonePe UTR record.";
    } else if (action === "reject") {
      updateData.paymentStatus = "Payment Rejected (Invalid UTR)";
      updateData.status = "Cancelled";
      updateData.adminNote = adminNote || "Invalid or unverified UTR number.";
    } else {
      return res.status(400).json({ message: "Invalid action. Use 'approve' or 'reject'." });
    }

    const query = buildOrderQuery(req.params.id);
    const result = await orders().findOneAndUpdate(
      query,
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result) return res.status(404).json({ message: "Order not found" });

    res.json({ message: `Order payment ${action === "approve" ? "verified and approved" : "rejected"} successfully`, order: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Customer re-enter / update UTR number
router.put("/:id/update-utr", async (req, res) => {
  try {
    const newUtr = String(req.body.utrNumber || "").trim();
    if (!newUtr || newUtr.length < 6) {
      return res.status(400).json({ message: "Please enter a valid 12-digit UTR / Reference number." });
    }

    const query = buildOrderQuery(req.params.id);
    const existing = await orders().findOne(query);
    if (!existing) return res.status(404).json({ message: "Order not found" });

    const updateData = {
      utrNumber: newUtr,
      transactionId: newUtr,
      paymentStatus: "Pending Verification",
      status: "Awaiting Verification",
      adminNote: "UTR updated by customer. Re-verification required.",
      updatedAt: new Date()
    };

    const result = await orders().findOneAndUpdate(
      query,
      { $set: updateData },
      { returnDocument: "after" }
    );

    res.json({ message: "UTR updated successfully. Submitted for admin verification.", order: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete order
router.delete("/:id", async (req, res) => {
  try {
    const query = buildOrderQuery(req.params.id);
    await orders().deleteOne(query);
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;