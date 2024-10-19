const mongoose = require('mongoose')

const schema = mongoose.Schema

const monthlyCollectionSchema = new schema({
    date: {type: String, required:true},
    totalInflows: {type: Number, required: true},
    totalOutflows: {type: Number, required: true},
    inflowDifference: {type: Number, required: true},
    inflowPecentageChange: {type: String, required: true},
    outflowDifference: {type: Number, required: true},
    outflowPercentageChange: {type: String, required: true},
    netIncome: {type: Number, required: true},
    inflows: [{
        _id:{type: Number, required: true},
        totalInflowAmount: {type: Number, required: true},
    }],
    outflows: [{
        _id:{type: Number, required: true},
        totalOutflowAmount: {type: Number, required: true}
    }]
}, { timestamps: true })

module.exports = mongoose.model("monthlyCollection", monthlyCollectionSchema)