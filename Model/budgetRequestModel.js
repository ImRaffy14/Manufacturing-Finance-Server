const mongoose = require("mongoose")

const schema = mongoose.Schema

const budgetRequestSchema = new schema({
    typeOfRequest: {type: String, required:true},
    category: {type: String, required:true},
    reason: {type: String, required:true},
    totalRequest: {type: Number, required:true},
    documents: {type: String, required:true},
    status: {type: String, required:true},
    comment: {type: String}
}, { timestamps: true})

module.exports = mongoose.model('budgetRequest', budgetRequestSchema)