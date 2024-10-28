const depositRecords = require('../Model/depositModel')
const withdrawRecords = require('../Model/withdrawModel')

module.exports = (socket, io) => {

    const addNewDeposit = async (data) => {
        
    }

    const addNewWithdraw = async (data) => {

    }

    socket.on("add_new_deposit", addNewDeposit)
    socket.on("add_new_withdraw", addNewWithdraw)
}