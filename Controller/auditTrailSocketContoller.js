const auditTrailsData = require('../Model/auditTrailsModel')

module.exports = (socket, io) => {

    //GET TIME
    function getCurrentDateTime() {
        const now = new Date();
        const date = now.toLocaleDateString();
        const time = now.toLocaleTimeString();
        return `${date} ${time}`;
    }

    //Handles GET all AUDIT TRAIL DATA
    const getTrails = async (data) => {
        const trailsData = await auditTrailsData.find({}).sort({createdAt : -1})
        socket.emit("receive_audit_trails", trailsData)
    }
    
    //Handles ADD TRAILS DATA
    const addTrails = async (data) => {
        
        try{
            const newTrail = new auditTrailsData ({dateTime: getCurrentDateTime(), userId: data.userId, userName: data.userName,  role: data.role, action: data.action, description: data.description})
            const trailSaved = await newTrail.save()
    
            const trailsData = await auditTrailsData.find({}).sort({createdAt : -1})
            if(trailSaved){
                io.emit("receive_audit_trails", trailsData)
            }
        }
        catch(err){
            socket.emit("trails_error", err.message)
        }
    }

    //LISTEN EVENTS
    socket.on("getAuditTrails", getTrails)
    socket.on("addAuditTrails", addTrails)
}