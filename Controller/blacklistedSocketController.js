const blacklistedRecords = require('../Model/blacklistedIpModel')

module.exports = (socket, io) => {

    const getBlacklisted = async (data) => {
        try{
            const result = await blacklistedRecords.find({})
            if(result){
                socket.emit("receive_blacklisted", result)
            }
        }
        catch(error){
            console.error(`blacklisted controller error: ${error.message}`)
        }
    }


    socket.on("get_blacklisted", getBlacklisted)
}