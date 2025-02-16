require('dotenv').config

const express = require('express');
const mongoose = require('mongoose')
const accounts = require('../Model/accountsModel')
const auditTrails = require('../Model/auditTrailsModel')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer')
const crypto = require('crypto')
const userOTP = require('../Model/userOTPModel')
const accountsModel = require('../Model/accountsModel')
const failedAttemptLogs = require('../Model/failedAttemptsModel')
const blacklistedIp = require('../Model/blacklistedIpModel')
const activeStaffRecords = require('../Model/activeStaffModel')
const UAParser = require("ua-parser-js");
const axios = require('axios')
const { generateServiceToken } = require('../middleware/gatewayTokenGenerator')

const router = express.Router()

// GET DEVICE INFO

//GET TIME
function getCurrentDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();
    return `${date} ${time}`;
  }



// MFA MIDDLEWARE
const firstAttempt = async (req, res, next) => {
    const { userName, firstLogin, password } = req.body

    // NODEMAILER CONFIGURATION
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'jjmmanufacturing0@gmail.com',
            pass: process.env.EMAIL_PWD,
        },
    });

    // GET IP ADDRESS
    const ip = 
        req.headers['cf-connecting-ip'] ||  
        req.headers['x-real-ip'] ||
        req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress || '';

    // GET USER DEVICE INFO
    const userAgent = req.headers["user-agent"];
    const parser = new UAParser(userAgent);
    const deviceInfo = parser.getResult();
    const deviceInformation = `${deviceInfo.device.model || "PC/Laptop"} / ${deviceInfo.browser.name} / ${deviceInfo.os.name}`

    
    try{
        //FIRST ATTEMPT LOGIN AUTHENTICATION
        if(!firstLogin){
            
            
            //CHECK IF THE IP IS ON BLACKLISTS
            const checkIp = await blacklistedIp.findOne({ ipAddress: ip})
            if(checkIp){
                if(checkIp.banned === true){
                    res.status(403).json({msg: 'Your IP has been blacklisted. Please contact your administrator or supervisor to resolve this issue.'})
                    return
                }

                // CHECK IF THE IP IS STILL ON BLACKLISTS
                const currentTime = Date.now();
                const banExpirationTime = checkIp.banTime + checkIp.banDuration;
                if (currentTime > banExpirationTime) {
                    await blacklistedIp.deleteOne({ ipAddress: ip });
                    const blacklistRecords = await blacklistedIp.find({})
                    req.io.emit('receive_blacklisted', blacklistRecords)
                    res.status(200).json({ success: true, msg: 'Your IP is no longer blacklisted. You can try logging in again.'}) 
                    return 
                }
                res.status(403).json({msg: "Your IP has been blacklisted due to excessive login attempts.", banTime: checkIp.banTime, banDuration: checkIp.banDuration})
                return
            }


            // FIND USER'S ACCOUNT
            // GET STAFF ACCOUNTS
            const serviceToken = generateServiceToken()
            const response = await axios.get(`${process.env.API_GATEWAY_URL}/admin/get-accounts`, {
                headers: { Authorization: `Bearer ${serviceToken}` }
            })
            const accountData = response.data
            const user = accountData.find(account => account.userName === userName)

            if(!user){
                const attemptLog = await failedAttemptLogs.findOne({ ipAddress: ip })


                // LOG THE IP ADDRESS FAILED ATTEMPT
                if(!attemptLog){
                    await failedAttemptLogs.create({ userId: 'Unknown ID', username: 'Unknown User', ipAddress: ip, attempts: 1})
                    res.status(400).json({msg: "Invalid Credentials"})

                    const result = await failedAttemptLogs.find({})
                    req.io.emit('receive_failed_attempt', result)
                    return 
                }

                const attempts = attemptLog.attempts

                //CHECKS IF THE ATTEMPTS IS ABOVE 2
                if(attempts == 3){
                     const result = await blacklistedIp.create({
                        userId: 'Unknown ID',
                        username: 'Unknown User',
                        ipAddress: ip,
                        banTime: Date.now(),
                        banDuration: 120000
                    })

                    await failedAttemptLogs.findOneAndUpdate(
                        { ipAddress: ip},
                        { attempts: attempts + 1 , attemptDate: Date.now()},
                    )

                    const blacklistRecords = await blacklistedIp.find({})
                    req.io.emit('receive_blacklisted', blacklistRecords)
                    res.status(403).json({msg: "Your IP has been blacklisted due to excessive login attempts.", banTime: result.banTime, banDuration: result.banDuration})
                    
                    const resultFailed = await failedAttemptLogs.find({})
                    req.io.emit('receive_failed_attempt', resultFailed)
                    return 
                }

                if(attempts == 5){
                    const result = await blacklistedIp.create({
                        userId: 'Unknown ID',
                        username: 'Unknown User',
                        ipAddress: ip,
                        banTime: Date.now(),
                       banDuration: 300000
                   })

                   await failedAttemptLogs.findOneAndUpdate(
                       { ipAddress: ip},
                       { attempts: attempts + 1 , attemptDate: Date.now()},
                   )

                   const blacklistRecords = await blacklistedIp.find({})
                   req.io.emit('receive_blacklisted', blacklistRecords)
                   res.status(403).json({msg: "Your IP has been blacklisted due to excessive login attempts.", banTime: result.banTime, banDuration: result.banDuration})
                  
                   const resultFailed = await failedAttemptLogs.find({})
                   req.io.emit('receive_failed_attempt', resultFailed)
                   return 
               }

                if(attempts == 7){
                    // GET IP LOCATION
                    const getLocation = await axios.get(`http://ip-api.com/json/${ip}`);
                    const location = getLocation.data.status === 'success'
                        ? `${getLocation.data.country} / ${getLocation.data.regionName} / ${getLocation.data.city}`
                        : 'N/A';
                    const result = await blacklistedIp.create({
                    userId: 'Unknown ID',
                    username: 'Unknown User',
                    ipAddress: ip,
                    banTime: Date.now(),
                    banDuration: 0,
                    banned: true,
                    deviceInfo: deviceInformation,
                    location: location
                })
                    const blacklistRecords = await blacklistedIp.find({})
                    req.io.emit('receive_blacklisted', blacklistRecords)
                    res.status(403).json({msg: "Your IP has been blacklisted due to multiple failed login attempts. Please contact your administrator or supervisor to resolve this issue.", banTime: result.banTime, banDuration: result.banDuration})
                    
                    const resultFailed = await failedAttemptLogs.find({})
                    req.io.emit('receive_failed_attempt', resultFailed)
                    return 
                }

                await failedAttemptLogs.findOneAndUpdate(
                    { ipAddress: ip},
                    { attempts: attempts + 1 , attemptDate: Date.now()},
                )

                res.status(400).json({msg: "Invalid Credentials"})

                const resultFailed = await failedAttemptLogs.find({})
                req.io.emit('receive_failed_attempt', resultFailed)
                return 
            }

            
            // CHECK IF THE PASSWORD IS MATCH
            const isMatch = await bcrypt.compare(password, user.password)
            if(!isMatch){

                const attemptLog = await failedAttemptLogs.findOne({ ipAddress: ip })
                
                // GETS USER CREDENTIAL
                const username = user.userName;
                const userId = user._id

                // LOG THE IP ADDRESS FAILED ATTEMPT
                if(!attemptLog){
                    await failedAttemptLogs.create({ userId: userId, username: username, ipAddress: ip, attempts: 1})

                    res.status(400).json({msg: "Invalid Credentials"})

                    const resultFailed = await failedAttemptLogs.find({})
                    req.io.emit('receive_failed_attempt', resultFailed)
                    return 
                }

                const attempts = attemptLog.attempts

                //CHECKS IF THE ATTEMPTS IS ABOVE 2
                if(attempts == 3){
                     const result = await blacklistedIp.create({
                        userId: userId,
                        username: username,
                        ipAddress: ip,
                        banTime: Date.now(),
                        banDuration: 120000
                    })

                    await failedAttemptLogs.findOneAndUpdate(
                        { ipAddress: ip},
                        { attempts: attempts + 1 , attemptDate: Date.now()},
                    )
                    
                    const blacklistRecords = await blacklistedIp.find({})
                    req.io.emit('receive_blacklisted', blacklistRecords)
                    res.status(403).json({msg: "Your IP has been blacklisted due to excessive login attempts.", banTime: result.banTime, banDuration: result.banDuration})
                    
                    const resultFailed = await failedAttemptLogs.find({})
                    req.io.emit('receive_failed_attempt', resultFailed)
                    return 
                }

                if(attempts == 5){
                    const result = await blacklistedIp.create({
                        userId: userId,
                        username: username,
                        ipAddress: ip,
                        banTime: Date.now(),
                       banDuration: 300000
                   })

                   await failedAttemptLogs.findOneAndUpdate(
                       { ipAddress: ip},
                       { attempts: attempts + 1 , attemptDate: Date.now()},
                   )

                   const blacklistRecords = await blacklistedIp.find({})
                   req.io.emit('receive_blacklisted', blacklistRecords)
                   res.status(403).json({msg: "Your IP has been blacklisted due to excessive login attempts.", banTime: result.banTime, banDuration: result.banDuration})
                  
                   const resultFailed = await failedAttemptLogs.find({})
                   req.io.emit('receive_failed_attempt', resultFailed)
                   return 
               }

                if(attempts == 7){
                    // GET IP LOCATION
                    const getLocation = await axios.get(`http://ip-api.com/json/${ip}`);
                    const location = getLocation.data.status === 'success'
                        ? `${getLocation.data.country} / ${getLocation.data.regionName} / ${getLocation.data.city}`
                        : 'N/A';
                    const result = await blacklistedIp.create({
                    userId: userId,
                    username: username,
                    ipAddress: ip,
                    banTime: Date.now(),
                    banDuration: 0,
                    banned: true,
                    deviceInfo: deviceInformation,
                    location: location
                })
                    const blacklistRecords = await blacklistedIp.find({})
                    req.io.emit('receive_blacklisted', blacklistRecords)
                    res.status(403).json({msg: "Your IP has been blacklisted due to multiple failed login attempts. Please contact your administrator or supervisor to resolve this issue.", banTime: result.banTime, banDuration: result.banDuration})
                   
                    const resultFailed = await failedAttemptLogs.find({})
                    req.io.emit('receive_failed_attempt', resultFailed)
                    return 
                }

                await failedAttemptLogs.findOneAndUpdate(
                    { ipAddress: ip},
                    { attempts: attempts + 1 , attemptDate: Date.now()},
                )

                const resultFailed = await failedAttemptLogs.find({})
                req.io.emit('receive_failed_attempt', resultFailed)
                res.status(400).json({msg: "Invalid Credentials"})
                return 
            }

            // GETS USER EMAIL
            const email = user.email

            // GENERATES OTP
            const generateOTP = () => crypto.randomInt(100000, 999999).toString();
            const otp = generateOTP()

            //CHECKS IF OTP IS STORED
            const otpStored = await userOTP.findOne({email: email})
            if(otpStored){
                await userOTP.deleteOne({email})
            }

            await userOTP.create({email, otp})

            // SENDING OTP TO THE USER EMAIL
            await transporter.sendMail({
                from: 'jjmmanufacturing0@gmail.com',
                to: email,
                subject: 'Your OTP Code',
                html: `
                <html>
                  <head>
                    <style>
                      body {
                        font-family: Arial, sans-serif;
                        background-color: #ffffff;
                        color: #333;
                        margin: 0;
                        padding: 0;
                      }
                      .container {
                        background-color: #4CAF50;
                        color: white;
                        padding: 30px;
                        text-align: center;
                        border-radius: 8px;
                        width: 100%;
                        max-width: 600px;
                        margin: 0 auto;
                      }
                      .logo {
                        width: 150px;
                        margin-bottom: 20px;
                      }            
                      .header {
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 20px;
                      }
                      .otp {
                        font-size: 28px;
                        font-weight: bold;
                        color: #ffffff;
                        background-color: #333333;
                        padding: 10px 20px;
                        border-radius: 5px;
                        display: inline-block;
                      }
                      .footer {
                        font-size: 14px;
                        margin-top: 20px;
                        color: #e5e5e5;
                      }
                      .footer a {
                        color: #e5e5e5;
                        text-decoration: none;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                    <img src="https://res.cloudinary.com/dpyhkumle/image/upload/v1737684672/423249788_854054440064776_370969774868051925_n_d75cbi.jpg" alt="JJM MANUFACTURING Logo" class="logo" />
                      <div class="header">JJM MANUFACTURING</div>
                      <p>Dear ${userName},</p>
                      <p>Here is your One-Time Password (OTP) for authentication:</p>
                      <div class="otp">${otp}</div>
                      <p>Use this OTP to proceed with your request. The OTP is valid for the next 5 minutes.</p>
                      <div class="footer">
                        <p>If you did not request this OTP, please ignore this email.</p>
                        <p>Thank you, <br/> JJM MANUFACTURING Dev Team</p>
                      </div>
                    </div>
                  </body>
                </html>
              `
            })
            
            res.status(401).json({msg: 'First Login Attempt.', email: email})
            return
        }

        jwt.verify(firstLogin, process.env.F_LOGIN_SECRET, (err) => {
            if (err) return res.status(412).json({msg: "Something went wrong, please try again."}); // INVALID TOKEN

            next()
        });

    }
    catch(err){
        res.status(500).json({msg: 'Something went wrong.'})
        console.log(err.message)
    }
}

// RESEND OTP
router.post('/resend-otp', async (req,res) => {
    const { email } = req.body
    
    try{
        // NODEMAILER CONFIGURATION
        const transporter = nodemailer.createTransport({
             service: 'gmail',
            auth: {
                user: 'jjmmanufacturing0@gmail.com',
                pass: process.env.EMAIL_PWD,
            },
        });

        // GENERATES OTP
        const generateOTP = () => crypto.randomInt(100000, 999999).toString();
        const otp = generateOTP()

        //CHECKS IF OTP IS STORED
        const otpStored = await userOTP.findOne({email: email})
        if(otpStored){
            await userOTP.deleteOne({email})
        }

        await userOTP.create({email, otp})

        // SENDING OTP TO THE USER EMAIL
        await transporter.sendMail({
            from: 'jjmmanufacturing0@gmail.com',
            to: email,
            subject: 'Your OTP Code',
            html: `
            <html>
              <head>
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    background-color: #ffffff;
                    color: #333;
                    margin: 0;
                    padding: 0;
                  }
                  .container {
                    background-color: #4CAF50;
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 8px;
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                  }
                  .logo {
                    width: 150px;
                    margin-bottom: 20px;
                  }            
                  .header {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 20px;
                  }
                  .otp {
                    font-size: 28px;
                    font-weight: bold;
                    color: #ffffff;
                    background-color: #333333;
                    padding: 10px 20px;
                    border-radius: 5px;
                    display: inline-block;
                  }
                  .footer {
                    font-size: 14px;
                    margin-top: 20px;
                    color: #e5e5e5;
                  }
                  .footer a {
                    color: #e5e5e5;
                    text-decoration: none;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                <img src="https://res.cloudinary.com/dpyhkumle/image/upload/v1737684672/423249788_854054440064776_370969774868051925_n_d75cbi.jpg" alt="JJM MANUFACTURING Logo" class="logo" />
                  <div class="header">JJM MANUFACTURING</div>
                  <p>Dear ${email},</p>
                  <p>Here is your One-Time Password (OTP) for authentication:</p>
                  <div class="otp">${otp}</div>
                  <p>Use this OTP to proceed with your request. The OTP is valid for the next 5 minutes.</p>
                  <div class="footer">
                    <p>If you did not request this OTP, please ignore this email.</p>
                    <p>Thank you, <br/> JJM MANUFACTURING Dev Team</p>
                  </div>
                </div>
              </body>
            </html>
          `
        })

        res.status(200).json({msg: 'The OTP is sent to your email.'})

    }
    catch(error){
        res.status(500).json({ msg: "Something Went Error", errMsg: error.message})
        console.log(error.message)
    }
    
})

// VERIFY OTP
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) return res.status(400).json({msg:'Email and OTP are required'});

    // FIND USER OTP
    const record = await userOTP.findOne({ email: email });

    if (!record) return res.status(400).json({msg:'No OTP found for this email'});
    if (record.otp !== otp) return res.status(400).json({ msg: 'Invalid OTP'});

    // CLEAR OTP AFTER VERIFICATION
    await userOTP.deleteOne({ email })

    const token = jwt.sign({email}, process.env.F_LOGIN_SECRET)
    
    res.status(200).json({ msg: 'Device Verified', token: token});
});

//LOGIN ROUTE
router.post('/login', firstAttempt, async (req, res) => {
    const { userName, password} = req.body

    // GET USER'S IP ADDRESS
    const ip = 
    req.headers['cf-connecting-ip'] ||  
    req.headers['x-real-ip'] ||
    req.headers['x-forwarded-for'] ||
    req.socket.remoteAddress || '';

    // GET USER DEVICE INFO
    const userAgent = req.headers["user-agent"];
    const parser = new UAParser(userAgent);
    const deviceInfo = parser.getResult();
    const deviceInformation = `${deviceInfo.device.model || "PC/Laptop"} / ${deviceInfo.browser.name} / ${deviceInfo.os.name}`


    try{

         //CHECK IF THE IP IS ON BLACKLISTS
         const checkIp = await blacklistedIp.findOne({ ipAddress: ip})
         if(checkIp){
             if(checkIp.banned === true){
                 res.status(403).json({msg: 'Your IP has been blacklisted. Please contact your administrator or supervisor to resolve this issue.'})
                 return
             }

             // CHECK IF THE IP IS STILL ON BLACKLISTS
             const currentTime = Date.now();
             const banExpirationTime = checkIp.banTime + checkIp.banDuration;
             if (currentTime > banExpirationTime) {
                 await blacklistedIp.deleteOne({ ipAddress: ip });
                 const blacklistRecords = await blacklistedIp.find({})
                 req.io.emit('receive_blacklisted', blacklistRecords)
                 res.status(200).json({ success: true, msg: 'Your IP is no longer blacklisted. You can try logging in again.'}) 
                 return 
             }
             res.status(403).json({msg: "Your IP has been blacklisted due to excessive login attempts.", banTime: checkIp.banTime, banDuration: checkIp.banDuration})
             return
         }

        // GET STAFF ACCOUNTS
        const serviceToken = generateServiceToken()
        const response = await axios.get(`${process.env.API_GATEWAY_URL}/admin/get-accounts`, {
            headers: { Authorization: `Bearer ${serviceToken}` }
        })
        const accountData = response.data
        const user = accountData.find(account => account.userName === userName)

        if(!user){
            const attemptLog = await failedAttemptLogs.findOne({ ipAddress: ip })


            // LOG THE IP ADDRESS FAILED ATTEMPT
            if(!attemptLog){
                await failedAttemptLogs.create({ userId: 'Unknown ID', username: 'Unknown User', ipAddress: ip, attempts: 1})
                res.status(400).json({msg: "Invalid Credentials"})

                const resultFailed = await failedAttemptLogs.find({})
                req.io.emit('receive_failed_attempt', resultFailed)
                return 
            }

            const attempts = attemptLog.attempts

            //CHECKS IF THE ATTEMPTS IS ABOVE 2
            if(attempts == 3){
                 const result = await blacklistedIp.create({
                    userId: 'Unknown ID',
                    username: 'Unknown User',
                    ipAddress: ip,
                    banTime: Date.now(),
                    banDuration: 120000
                })

                await failedAttemptLogs.findOneAndUpdate(
                    { ipAddress: ip},
                    { attempts: attempts + 1 , attemptDate: Date.now()},
                )

                const blacklistRecords = await blacklistedIp.find({})
                req.io.emit('receive_blacklisted', blacklistRecords)
                res.status(403).json({msg: "Your IP has been blacklisted due to excessive login attempts.", banTime: result.banTime, banDuration: result.banDuration})
                
                const resultFailed = await failedAttemptLogs.find({})
                req.io.emit('receive_failed_attempt', resultFailed)
                return 
            }

            if(attempts == 5){
                const result = await blacklistedIp.create({
                    userId: 'Unknown ID',
                    username: 'Unknown User',
                    ipAddress: ip,
                    banTime: Date.now(),
                   banDuration: 300000
               })

               await failedAttemptLogs.findOneAndUpdate(
                   { ipAddress: ip},
                   { attempts: attempts + 1 , attemptDate: Date.now()},
               )

               const blacklistRecords = await blacklistedIp.find({})
               req.io.emit('receive_blacklisted', blacklistRecords)
               res.status(403).json({msg: "Your IP has been blacklisted due to excessive login attempts.", banTime: result.banTime, banDuration: result.banDuration})
               
               const resultFailed = await failedAttemptLogs.find({})
               req.io.emit('receive_failed_attempt', resultFailed)
               return 
           }

            if(attempts == 7){
                // GET IP LOCATION
                const getLocation = await axios.get(`http://ip-api.com/json/${ip}`);
                const location = getLocation.data.status === 'success'
                    ? `${getLocation.data.country} / ${getLocation.data.regionName} / ${getLocation.data.city}`
                    : 'N/A';
                const result = await blacklistedIp.create({
                userId: 'Unknown ID',
                username: 'Unknown User',
                ipAddress: ip,
                banTime: Date.now(),
                banDuration: 0,
                banned: true,
                deviceInfo: deviceInformation,
                location: location
            })
                const blacklistRecords = await blacklistedIp.find({})
                req.io.emit('receive_blacklisted', blacklistRecords)
                res.status(403).json({msg: "Your IP has been blacklisted due to multiple failed login attempts. Please contact your administrator or supervisor to resolve this issue.", banTime: result.banTime, banDuration: result.banDuration})
                
                const resultFailed = await failedAttemptLogs.find({})
                req.io.emit('receive_failed_attempt', resultFailed)
                return 
            }

            await failedAttemptLogs.findOneAndUpdate(
                { ipAddress: ip},
                { attempts: attempts + 1 , attemptDate: Date.now()},
            )
                
            res.status(400).json({msg: "Invalid Credentials"})

            const resultFailed = await failedAttemptLogs.find({})
            req.io.emit('receive_failed_attempt', resultFailed)
            return 
        }

        
        // CHECK IF THE PASSWORD IS MATCH
        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch){

            const attemptLog = await failedAttemptLogs.findOne({ ipAddress: ip })
            
            // GETS USER CREDENTIAL
            const username = user.userName;
            const userId = user._id

            // LOG THE IP ADDRESS FAILED ATTEMPT
            if(!attemptLog){
                await failedAttemptLogs.create({ userId: userId, username: username, ipAddress: ip, attempts: 1})
                res.status(400).json({msg: "Invalid Credentials"})

                const resultFailed = await failedAttemptLogs.find({})
                req.io.emit('receive_failed_attempt', resultFailed)
                return 
            }

            const attempts = attemptLog.attempts

            //CHECKS IF THE ATTEMPTS IS ABOVE 2
            if(attempts == 3){
                 const result = await blacklistedIp.create({
                    userId: userId,
                    username: username,
                    ipAddress: ip,
                    banTime: Date.now(),
                    banDuration: 120000
                })

                await failedAttemptLogs.findOneAndUpdate(
                    { ipAddress: ip},
                    { attempts: attempts + 1 , attemptDate: Date.now()},
                )
                
                const blacklistRecords = await blacklistedIp.find({})
                req.io.emit('receive_blacklisted', blacklistRecords)
                res.status(403).json({msg: "Your IP has been blacklisted due to excessive login attempts.", banTime: result.banTime, banDuration: result.banDuration})
                
                const resultFailed = await failedAttemptLogs.find({})
                req.io.emit('receive_failed_attempt', resultFailed)
                return 
            }

            if(attempts == 5){
                const result = await blacklistedIp.create({
                    userId: userId,
                    username: username,
                    ipAddress: ip,
                    banTime: Date.now(),
                   banDuration: 300000
               })

               await failedAttemptLogs.findOneAndUpdate(
                   { ipAddress: ip},
                   { attempts: attempts + 1 , attemptDate: Date.now()},
               )

               const blacklistRecords = await blacklistedIp.find({})
               req.io.emit('receive_blacklisted', blacklistRecords)
               res.status(403).json({msg: "Your IP has been blacklisted due to excessive login attempts.", banTime: result.banTime, banDuration: result.banDuration})
               
               const resultFailed = await failedAttemptLogs.find({})
               req.io.emit('receive_failed_attempt', resultFailed)
               return 
           }

            if(attempts == 7){
                // GET IP LOCATION
                const getLocation = await axios.get(`http://ip-api.com/json/${ip}`);
                const location = getLocation.data.status === 'success'
                    ? `${getLocation.data.country} / ${getLocation.data.regionName} / ${getLocation.data.city}`
                    : 'N/A';
                const result = await blacklistedIp.create({
                userId: userId,
                username: username,
                ipAddress: ip,
                banTime: Date.now(),
                banDuration: 0,
                banned: true,
                deviceInfo: deviceInformation,
                location: location
            })
                const blacklistRecords = await blacklistedIp.find({})
                req.io.emit('receive_blacklisted', blacklistRecords)
                res.status(403).json({msg: "Your IP has been blacklisted due to multiple failed login attempts. Please contact your administrator or supervisor to resolve this issue.", banTime: result.banTime, banDuration: result.banDuration})
                
                const resultFailed = await failedAttemptLogs.find({})
                req.io.emit('receive_failed_attempt', resultFailed)
                return 
            }

            await failedAttemptLogs.findOneAndUpdate(
                { ipAddress: ip},
                { attempts: attempts + 1 , attemptDate: Date.now()},
            )

            res.status(400).json({msg: "Invalid Credentials"})
            
            const resultFailed = await failedAttemptLogs.find({})
            req.io.emit('receive_failed_attempt', resultFailed)
            return 
        }
        

        //CHECK THE IP IF STILL ON FAILED ATTEMPTS RECORDS
        const blacklisted = await failedAttemptLogs.findOne({ ipAddress: ip })
        if(blacklisted){
            await failedAttemptLogs.findOneAndDelete( { ipAddress: ip } )
        }

        // UPDATE SUPER ADMIN THAT FAILED LOGIN ATTEMPT IS RESOLVED
        const result = await failedAttemptLogs.find({})
        req.io.emit('receive_failed_attempt', result)

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



        res.cookie('refreshToken', refreshToken, {
            httpOnly: true, 
            secure: true, 
            sameSite: 'None', 
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

        // GET STAFF ACCOUNTS
        const serviceToken = generateServiceToken()
        const response = await axios.get(`${process.env.API_GATEWAY_URL}/admin/get-accounts`, {
            headers: { Authorization: `Bearer ${serviceToken}` }
        })
        const accountData = response.data
        const users = accountData.find(account => account._id === req.user.id)
        const { password, ...usersWithoutPassword } = users

        res.json(usersWithoutPassword);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Log out
router.post('/logout', async (req, res) => {
    // SET OFFLINE STAFF
    const ip = 
    req.headers['cf-connecting-ip'] ||  
    req.headers['x-real-ip'] ||
    req.headers['x-forwarded-for'] ||
    req.socket.remoteAddress || '';

    await activeStaffRecords.findOneAndDelete({ ipAddress: ip })
    const result = await activeStaffRecords.find({})
    req.io.emit('receive_active_staff', result)

    // CLEAR COOKIES (REFRESH TOKEN)
    res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'None' });
    res.sendStatus(204);
});

module.exports = router