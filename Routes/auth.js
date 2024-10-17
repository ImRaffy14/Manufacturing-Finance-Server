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
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET,{ expiresIn: '15m'})
        
        //GENERATES REFRESH TOKEN IF ACCESS TOKEN IS EXPIRED
        const refreshToken = jwt.sign({id: user._id}, process.env.REFRESH_JWT_SECRET,{ expiresIn: '1d'})

        const webSocketToken = jwt.sign({id: user._id}, process.env.WEBSOCKET_JWT_SECRET,{ expiresIn: '1d'})

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true, 
            secure: true, 
            sameSite: 'Strict', 
            maxAge: 24 * 60 * 60 * 1000 // 1 day expiration
        });

        res.cookie('webSocketToken', webSocketToken, {
            httpOnly: true, 
            secure: true, 
            sameSite: 'Strict', 
            maxAge: 24 * 60 * 60 * 1000 // 1 day expiration
        });

        res.json({token})        
    }
    catch (err){
        res.status(500).json({err: err.message, message: "Server Error"})
    }
})

// Refresh token route
router.post('/refresh-token', (req, res) => {
    const refreshToken = req.cookies.refreshToken; 
    if (!refreshToken) return res.sendStatus(403); // Forbidden

    jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Invalid token
        
        const userId = user.id;

        const newAccessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
        
        res.json({ accessToken: newAccessToken });
    });
});



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

// Log out
router.post('/logout', (req, res) => {
    res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'Strict' });
    res.clearCookie('webSocketToken', { httpOnly: true, secure: true, sameSite: 'Strict' });
    res.sendStatus(204);
});

module.exports = router