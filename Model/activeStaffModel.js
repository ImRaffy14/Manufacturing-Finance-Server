const mongoose = require('mongoose')

const schema = mongoose.Schema

//GET TIME
function getCurrentDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();
    return `${date} ${time}`;
  }

const activeStaffSchema = new schema({
    ipAddress: { type: String, unique: true },
    socketId: { type: String, required: true},
    date: { type: String, default: getCurrentDateTime() },
    userId: { type: String, required:true },
    username: { type: String, required:true },
    role: { type: String, required:true },
    deviceInfo: { type: String },
    location: { type: String }
})

module.exports = mongoose.model('activeStaff', activeStaffSchema)