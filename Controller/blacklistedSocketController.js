const blacklistedRecords = require('../Model/blacklistedIpModel')
const { verifyPassword } = require('../middleware/passwordVerification')

module.exports = (socket, io) => {


    // GET BLACKLISTED DATA
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

    // RESOLVE BLACKLISTED ACCOUNT
    const resolveBlacklistedAccount = async (data) => {
        try{
            const user = await verifyPassword(data.userName, data.password)
            if(!user){
                return socket.emit('error_verification', {msg: 'Invalid Credentials'})
            }

            await blacklistedRecords.findOneAndDelete({ _id: data.row._id})
            const result = await blacklistedRecords.find({})
            if(result){
                io.emit("receive_blacklisted", result)
                socket.emit("blacklist_success", {msg: 'Client is now removed to the blacklist'})
            }
        }
        catch(error){
            console.error(`Resolve blacklisted account error: ${error.message}`)
            socket.emit('blacklist_error')
        }
    }

    socket.on('resolve_blacklisted', resolveBlacklistedAccount)
    socket.on("get_blacklisted", getBlacklisted)
}