const mongoose = require('mongoose')

const schema = mongoose.Schema

const sampleSchema = new schema ({
    name:{
        type: String,
        required: true
    },
    age:{
        type: Number,
        required: true
    }
}, {timestamp: true})

module.exports = mongoose.model('Sample', sampleSchema)