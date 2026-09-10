const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
    },

    customerEmail: {
      type: String,
      required: true,
    },

    items: [
      {
        title: {
          type: String,
          required: true,
        },

        author: {
          type: String,
          default: "",
        },

        price: {
          type: Number,
          required: true,
        },

        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
    },

    paymentMethod: {
      type: String,
      default: "Cash on Delivery",
    },

    deliveryAddress: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      zipCode: { type: String, default: "" },
      phone: { type: String, default: "" },
      fullAddress: { type: String, default: "" }
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);