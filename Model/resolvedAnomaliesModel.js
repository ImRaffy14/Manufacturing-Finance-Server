const mongoose = require('mongoose')

const schema = mongoose.Schema

const resolvedAnomaliesSchema = new schema({
    anomalyType: { type: String, required: true},
    dataId: { type: String },
    anomalyFrom: { type: String, required: true},
    description: { type: String, required: true},
    resolvedBy: { type: String, required: true},
    resolvedDate: { type: Date, default: Date.now()},
})

module.exports = mongoose.model('resolvedAnomlies', resolvedAnomaliesSchema)