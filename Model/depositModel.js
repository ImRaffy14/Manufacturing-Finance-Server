const mongoose = require('mongoose')

const schema = mongoose.Schema

const depositSchema = new schema({
    dateTime: { type: String, required: true},
    adminId: { type: String, required: true },
    admin: { type: String, required: true },
    totalAmount: { type: Number, required: true }
}, { timestamps: true })

module.exports = mongoose.model("depositRecord", depositSchema)