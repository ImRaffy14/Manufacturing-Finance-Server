const mongoose = require('mongoose');

const schema = mongoose.Schema;

// Define a schema for each item
const itemSchema = new schema({
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
});

// Main invoice schema
const invoiceRecordsModel = new schema({
    customerAddress: { type: String, required: true },
    customerContact: { type: Number, required: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    deliveryDate: { type: String, required: true },
    discounts: { type: String, required: true },
    dueDate: { type: String, required: true },
    invoiceDate: { type: String, required: true },
    items: { type: [itemSchema], required: true },
    notes: { type: String },
    orderDate: { type: String, required: true },
    orderNumber: { type: Number, required: true },
    shippingMethod: { type: String, required: true },
    subTotal: { type: Number, required: true },
    terms: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    Status: { type: String, default: "Pending"}
}, { timestamps: true });

module.exports = mongoose.model("invoiceRecord", invoiceRecordsModel);
