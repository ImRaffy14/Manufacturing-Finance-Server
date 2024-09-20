const express = require('express');
const mongoose = require('mongoose')
const accounts = require('../Model/accountsModel')
const auditTrails = require('../Model/auditTrailsModel')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router()


//GET TIME
function getCurrentDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();
    return `${date} ${time}`;
  }


//LOGIN ROUTE
router.post('/login', async (req, res) => {
    const { userName, password } = req.body

    try{
        const user = await accounts.findOne({ userName })
        if(!user){
            return res.status(400).json({msg: "Invalid Credentials"})
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch){
            return res.status(400).json({msg: "Invalid Credentials"})
        }
        
        //SAVING THE LOGIN INFO TO AUDIT TRAILS
        const newTrail = new auditTrails ({dateTime: getCurrentDateTime(), userId: user._id, userName,  role: user.role, action: "LOGIN", description: "Logged in to the system."})
        const savedTrails = await newTrail.save()

        const trailsData = await auditTrails.find({}).sort({createdAt : -1})
        if(savedTrails){
            req.io.emit("receive_audit_trails", trailsData)
        }
        //GENERATES TOKENS AFTER LOGIN REQUEST MATCHED
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET,{ expiresIn: '1h'})

        res.json({token})
        
        
    }
    catch (err){
        res.status(500).json({err: err.message, message: "Server Error"})
    }
})


// Verify Token Middleware
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};


// Protected Route
router.get('/protected', verifyToken, async (req, res) => {
    try {
        const user = await accounts.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router