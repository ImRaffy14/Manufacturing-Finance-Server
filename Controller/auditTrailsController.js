const auditTrailsData = require('../Model/auditTrailsModel')

//GET AUDIT TRAILS DATA
const auditTrailsRecord = async (req, res) => {
    const data = await auditTrailsData.find({}).sort({createdAt : -1})
    res.status(200).json(data)
}

//GET TIME
function getCurrentDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();
    return `${date} ${time}`;
  }

//ADD NEW AUDIT TRAILSr
const createAuditTrails = async (req, res) => {
    const {userId, userName, role, action, description} = req.body

    try{
        const newTrail = new auditTrailsData ({dateTime: getCurrentDateTime(), userId, userName,  role, action, description})
        await newTrail.save()
        res.status(200).json({msg: "Logout Audits"})
    }
    catch(err){
        res.status(500).json({ error: err.message})
    }
}

module.exports = {
    auditTrailsRecord,
    createAuditTrails
}