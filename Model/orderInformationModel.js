const mongoose = require('mongoose')

const schema = mongoose.Schema

const itemSchema = new schema({
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
});

const orderInformationSchema = new schema({
    orderNumber: { type: String, required: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerAddress: { type: String, required: true },
    orders: { type: [itemSchema], required: true },
    contactInformation: { type: Number, required: true },
    orderDate: { type: String, required: true },
    deliveryDate: { type: String, required: true },
    shippingMethod: { type: String, required: true },
    paymentMethod: { type: String, required: true },
}, { timestamps: true })

module.exports = mongoose.model("orderInformation", orderInformationSchema)