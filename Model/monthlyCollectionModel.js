const mongoose = require('mongoose')

const schema = mongoose.Schema

const monthlyCollectionSchema = new schema({
    date: {type: String, required:true, unique: true},
    salesVolume: {type: Number, required: true},
    totalInflows: {type: Number, required: true},
    totalOutflows: {type: Number, required: true},
    inflowDifference: {type: Number, required: true},
    inflowPercentageChange: {type: String},
    inflowDifferenceArrow: {type: String},
    inflowPercentageChangeArrow: {type: String},
    outflowDifferenceArrow: {type: String},
    outflowPercentageChangeArrow: {type: String},
    outflowDifference: {type: Number, required: true},
    outflowPercentageChange: {type: String},
    netIncome: {type: Number, required: true},
    inflows: [{
        _id:{type: Number, required: true},
        totalInflowAmount: {type: Number, required: true},
    }],
    outflows: [{
        _id:{type: Number, required: true},
        totalOutflowAmount: {type: Number, required: true}
    }],
    inflowRecords: [{
        _id: {type: String, required:true},
        dateTime: {type: String, required:true},
        auditor: { type: String, required: true },
        auditorId: { type: String, required: true },
        invoiceId: {type: String, required: true},
        customerName: { type: String, required: true },
        totalAmount: { type: Number, required: true }
    }],
    outflowRecords: [{
        _id: {type: String, required:true},
        dateTime: { type: String, required: true },
        approver: { type: String, required: true },
        approverId: { type: String, required: true },
        payableId: { type: String, required: true },
        category: { type: String, required: true },
        department: { type: String, required: true },
        totalAmount: { type: Number, required: true }
    }]
}, { timestamps: true })

module.exports = mongoose.model("monthlyCollection", monthlyCollectionSchema)