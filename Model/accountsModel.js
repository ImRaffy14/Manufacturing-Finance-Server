const mongoose = require('mongoose')

const Schema = mongoose.Schema

const accountSchema = new Schema({
    image:{
        type: String,
        default: "bobo kaba? angelo???"
    },

    userName:{
        type: String,
        required: true
    },

    password:{
        type: String,
        required: true
    },

    email:{
        type: String,
        required: true
    },

    fullName:{
        type: String,
        required: true
    },

    role:{
        type: String,
        required: true
    }
}, {timestamp: true})

module.exports = mongoose.model('account', accountSchema)