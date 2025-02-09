const mongoose = require('mongoose')

const schema = mongoose.Schema

const activeStaffSchema = new schema({
    ipAddress: { type: String, unique: true },
    date: { type: Date, default: Date.now },
    userId: { type: String, required:true },
    username: { type: String, required:true },
    role: { type: String, required:true },
})

module.exports = mongoose.model('activeStaff', activeStaffSchema)