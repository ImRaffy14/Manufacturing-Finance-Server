const mongoose = require('mongoose')
const accounts = require('../Model/accountsModel')
const bcrypt = require('bcryptjs');


const getAccounts = async (req, res) => {
    const account = await accounts.find({}).sort({createdAt : -1})
    res.status(200).json(account)
}

const createAccount = async (req, res) =>{

    const { image, userName, password, email, fullName, role } = req.body

    try{

        const existingUser = await accounts.findOne({ userName })
    
        if(existingUser){
            return res.status(400).json({msg: 'Account Already Exist'})
        }
    
        const hashedPassword = await bcrypt.hash(password, 10)
    
        const newAccount = new accounts({ image, userName, password: hashedPassword, email, fullName, role })
        await newAccount.save()
    
        res.status(200).json({msg : `Account for ${fullName} is created`})
    }
    catch (err) {
        res.status(500).json({ error: err.message})
    }
}

module.exports = {
    getAccounts,
    createAccount
} 