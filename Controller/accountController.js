const mongoose = require('mongoose')
const accounts = require('../Model/accountsModel')
const bcrypt = require('bcryptjs');
const cloudinary = require('../utils/cloudinaryConfig')
const fs = require("fs"); 

//GET ALL ACCOUNTS DATA
const getAccounts = async (req, res) => {
    const account = await accounts.find({}).sort({createdAt : -1})
    res.status(200).json(account)
}


//CREATE NEW ACCOUNT
const createAccount = async (req, res) =>{

    
    const { userName, password, email, fullName, role } = req.body

    try{
        const existingUser = await accounts.findOne({ userName })
    
        if(existingUser){
           
            if (req.file) {
                fs.unlinkSync(req.file.path);
              }

            res.status(400).json({msg: 'Account Already Exist'})
            return
        }
        
        let imageUrl = "https://res.cloudinary.com/dpyhkumle/image/upload/v1726909259/profile_placeholder_zzmmqd.png";
        if (req.file) {
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "profiles",
          });
          imageUrl = result.secure_url;
    
          fs.unlinkSync(req.file.path);
        }

        const hashedPassword = await bcrypt.hash(password, 10)
    
        const newAccount = new accounts({ image: imageUrl, userName, password: hashedPassword, email, fullName, role })
        await newAccount.save()
    
        res.status(200).json({msg : `Account for ${fullName} is created`})
    }
    catch (err) {
        res.status(500).json({ msg: err.message });

        console.log(err)
    }
}

module.exports = {
    getAccounts,
    createAccount
} 