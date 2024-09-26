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
        
        let public_id = "";
        let imageUrl = "";
        if (req.file) {
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "profiles",
          });
          imageUrl = result.secure_url;
          public_id = result.public_id
          fs.unlinkSync(req.file.path);
        }

        const hashedPassword = await bcrypt.hash(password, 10)
    
        const newAccount = new accounts({ image: {public_id: public_id, secure_url: imageUrl}, userName, password: hashedPassword, email, fullName, role })
        const data = await newAccount.save()
    
        res.status(200).json({msg : `Account for ${fullName} is created`, dataUser: {userName: data.userName, user_id: data._id}})
    }
    catch (err) {
        res.status(500).json({ msg: err.message });
    }
}

//UPDATE ACCOUNT
const updateAccount = async (req, res) => {
    const{ userId, userName, password, email, fullName, role } = req.body

    try{
        const existingUser = await accounts.findById(userId);
        if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
        }

        const update = {};

        if (userName && userName !== existingUser.userName) {
            update.userName = userName;
          }

        if (password && password !== existingUser.password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        update.password = hashedPassword;
        }

        if (email && email !== existingUser.email) {
            update.email = email;
          }

        if (fullName && fullName !== existingUser.fullName) {
        update.fullName = fullName;
        }

        if (role && role !== existingUser.role) {
            update.role = role;
          }

        const updatedUser = await accounts.findByIdAndUpdate(userId, update, { new: true });
        
        if(updatedUser){
            const result = await accounts.find({}).sort({createdAt : -1})
            req.io.emit("receive_accounts", result)

            res.status(200).json({ message: 'User updated successfully' });
        }

    }
    catch(err){
        res.status(500).json({error: err.message})
    }   
}


//DELETE ACCOUNT
const deleteAccount = async (req, res) => {
        const { userId, userName, password, public_id } = req.body

    try{

        console.log(public_id)
        
        const user = await accounts.findOne({ userName })
        if(!user){
            return res.status(400).json({msg: "Invalid Credentials"})
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch){
            return res.status(400).json({msg: "Invalid Credentials"})
        }

        const deletedUser = await accounts.findByIdAndDelete(userId);

        if (!deletedUser) {
        return res.status(404).json({ message: 'User not found' });
    }

       await cloudinary.uploader.destroy(public_id,(error, result) => {
            if(error){
                console.log(error)
            }
            console.log(result)
       })

    const result = await accounts.find({}).sort({createdAt : -1})
    req.io.emit("receive_accounts", result)
    res.status(200).json({ message: 'User account deleted successfully' });

    }
    catch(err){
        res.status(500).json({error: err.message})
    }
}

module.exports = {
    getAccounts,
    createAccount,
    updateAccount,
    deleteAccount
} 