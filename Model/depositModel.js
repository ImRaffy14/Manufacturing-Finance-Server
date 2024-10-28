const mongoose = require('mongoose')

const schema = mongoose.Schema

const depositSchema = new schema({
    date: { type: String, required: true},
    adminId: { type: String, required: true },
    admin: { type: String, required: true },
    totalAmount: { type: String, required: true }
}, { timestamps: true })

module.exports = mongoose.model("depositRecord", depositSchema)