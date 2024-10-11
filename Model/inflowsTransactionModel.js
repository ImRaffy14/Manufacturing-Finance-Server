const mongoose = require('mongoose')

const schema = mongoose.Schema

const inflowsTransactionSchema = new schema({
    dateTime: {type: String, required:true},
    invoiceId: {type: String, required: true},
    customerName: { type: String, required: true },
    totalAmount: { type: Number, required: true }
})

module.exports = mongoose.model("inflowsTransaction", inflowsTransactionSchema)