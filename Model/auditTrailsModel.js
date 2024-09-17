const mongoose = require("mongoose")

const schema = mongoose.Schema

const auditTrailSchema = new schema({
    dateTime:{
        type: String,
        required: true
    },
    userId:{
        type: String,
        required: true 
    },
    userName:{
        type: String,
        required:true
    },
    role:{
        type: String,
        required: true
    },
    action:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    }
},{ timestamps: true })

module.exports = mongoose.model("auditTrail", auditTrailSchema)