require('dotenv').config()

const auditTrailsData = require('../Model/auditTrailsModel')
const { encryptData } = require("../middleware/encryption")


//GET AUDIT TRAILS DATA
const auditTrailsRecord = async (req, res) => {
    const data = await auditTrailsData.find({}).sort({createdAt : -1})
    const result = encryptData(data, process.env.ENCRYPT_KEY)
    res.status(200).json(result)
}

//GET TIME
function getCurrentDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();
    return `${date} ${time}`;
  }

//ADD NEW AUDIT TRAILS
const createAuditTrails = async (req, res) => {
    const {userId, userName, role, action, description} = req.body

    try{
        const newTrail = new auditTrailsData ({dateTime: getCurrentDateTime(), userId, userName,  role, action, description})
        await newTrail.save()
        res.status(200).json({msg: "Logged Audits"})
    }
    catch(err){
        res.status(500).json({ error: err.message})
    }
}

module.exports = {
    auditTrailsRecord,
    createAuditTrails
}