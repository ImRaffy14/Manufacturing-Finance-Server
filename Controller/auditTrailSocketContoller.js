const auditTrailsData = require('../Model/auditTrailsModel')

module.exports = (socket, io) => {

    //Handles GET all AUDIT TRAIL DATA
    const getTrails = async (data) => {
        const trailsData = await auditTrailsData.find({}).sort({createdAt : -1})
        io.emit("receive_audit_trails", trailsData)
    }
    
    //Handles ADD TRAILS DATA
    const addTrails = async (data) => {
        const newTrail = new auditTrailsData ({dateTime: data.dateTime, userId: data.userId, userName: data.userName,  role: data.role, action: data.action, description: data.description})
        await newTrail.save()
    }

    socket.on("getAuditTrails", getTrails)
    socket.on("addAuditTrails", addTrails)
}