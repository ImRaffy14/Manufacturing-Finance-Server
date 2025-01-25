const mongoose = require('mongoose')

const Schema = mongoose.Schema

const failedAttemptSchema = new Schema({
    userId: { type: String, required: true},
    username: { type: String, required: true},
    ipAddress: { type: String, required: true},
    attempts: { type: Number, required: true},
    attemptDate: {type: Date, default: Date.now}
})

module.exports = mongoose.model('failedAttemptLogs', failedAttemptSchema)