const mongoose = require('mongoose')

const Schema = mongoose.Schema

const blacklistedIpSchema = new Schema({
    userId: { type: String, required: true},
    username: { type: String, required: true},
    ipAddress: { type: String, required: true},
    banTime: { type: Number },
    banDuration: { type: Number},
    banned: { type: Boolean, default: false }
})

module.exports = mongoose.model('blacklistIp', blacklistedIpSchema)