const accountsRecord = require('../Model/accountsModel')

module.exports = (socket, io) => {


    //Handles GET all Accounts Data
    const getAccounts = async (data) => {
        const trailsData = await accountsRecord.find({}).sort({createdAt : -1})
        socket.emit("receive_accounts", trailsData)
    }
    

    //LISTEN EVENTS
    socket.on("getAccounts", getAccounts)
}