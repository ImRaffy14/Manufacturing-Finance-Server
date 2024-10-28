const accounts = require('../Model/accountsModel')
const depositRecords = require('../Model/depositModel')
const withdrawRecords = require('../Model/withdrawModel')
const bcrypt = require('bcryptjs')
const { totalCompanyCash } = require('../Model/totalCashAggregation')

module.exports = (socket, io) => {

    //GET TIME
    function getCurrentDateTime() {
        const now = new Date();
        const date = now.toLocaleDateString('en-US'); 
        const time = now.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
    
        return `${date} ${time}`;
    }
    

    const addNewDeposit = async (data) => {
        
        const userName = data.username
        const password = data.password

        const user = await accounts.findOne({ userName })
        if(!user){
            return socket.emit('receive_deposit_authUser_invalid', {msg: 'Invalid Credentials'})
        }
    
        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch){
           return socket.emit('receive_deposit_authUser_invalid', {msg: 'Invalid Credentials'})
        }
        
        const newDeposit = new depositRecords({dateTime: getCurrentDateTime(), adminId: user._id, admin: user.userName, totalAmount: data.totalAmount})
        await newDeposit.save()

        socket.emit("receive_deposit", {msg: `₱${data.totalAmount} deposits on cash company.`, amount: data.totalAmount})

        const totalCash = await totalCompanyCash()
        io.emit("receive_total_cash", totalCash)

    }

    const addNewWithdraw = async (data) => {
        
        const userName = data.username
        const password = data.password

        const user = await accounts.findOne({ userName })
        if(!user){
            return socket.emit('receive_withdraw_authUser_invalid', {msg: 'Invalid Credentials'})
        }
    
        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch){
           return socket.emit('receive_withdraw_authUser_invalid', {msg: 'Invalid Credentials'})
        }

        const newWithdraw = new withdrawRecords({dateTime: getCurrentDateTime(), adminId: user._id, admin: user.userName, totalAmount: data.totalAmount})
        await newWithdraw.save()
        
        socket.emit("receive_withdraw", {msg: `₱${data.totalAmount} withdraw on cash company.`, amount: data.totalAmount})

        const totalCash = await totalCompanyCash()
        io.emit("receive_total_cash", totalCash)
        
    }

    socket.on("add_new_deposit", addNewDeposit)
    socket.on("add_new_withdraw", addNewWithdraw)
}