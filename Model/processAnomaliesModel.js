const mongoose = require('mongoose')

const schema = mongoose.Schema

const resolvedAnomaliesSchema = new schema({
    anomalyType: { type: String, required: true},
    dataId: { type: String },
    anomalyFrom: { type: String, required: true},
    description: { type: String },
    investigateBy: { type: String },
    investigateDate: { type: Date } ,
    resolvedBy: { type: String },
    resolvedDate: { type: Date },
    resolutionAction: { type: String },
    status: { type: String }
}, { timestamps: true })

module.exports = mongoose.model('resolvedAnomlies', resolvedAnomaliesSchema)