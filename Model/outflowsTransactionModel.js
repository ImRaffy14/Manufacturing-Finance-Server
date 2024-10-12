const mongoose = require('mongoose')

const schema = mongoose.Schema

const outflowsTransactionSchema = new schema({
    dateTime: { type: String, required: true },
    approver: { type: String, required: true },
    approverId: { type: String, required: true },
    requestId: { type: String, required: true },
    category: { type: String, required: true },
    department: { type: String, required: true },
    totalAmount: { type: Number, required: true }
})

module.exports = mongoose.model('outflowsTransaction', outflowsTransactionSchema)