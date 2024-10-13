const inflowsTransaction = require('../Model/inflowsTransactionModel')
const accounts = require('../Model/accountsModel')
const invoiceRecords = require('../Model/invoiceRecordsModel')
const { getToAuditRecords } = require('../Model/invoiceAggregation')

const bcrypt = require('bcryptjs')

module.exports = (socket, io) => {

    //GET TIME
    function getCurrentDateTime() {
        const now = new Date();
        const date = now.toLocaleDateString();
        const time = now.toLocaleTimeString();
        return `${date} ${time}`;
    }

    const authUser = async (data) => {

        const userName = data.userName
        const password = data.password
        const invoiceId = data.invoiceId

        const user = await accounts.findOne({ userName })
        if(!user){
            return socket.emit('receive_audit_authUser_invalid', {msg: 'Invalid Credentials'})
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch){
           return socket.emit('receive_audit_authUser_invalid', {msg: 'Invalid Credentials'})
        }

        const transactionMatched = await inflowsTransaction.findOne({ invoiceId })

        if(transactionMatched){
            return socket.emit('receive_audit_matched', {msg: `Transaction for Invoice ID: ${data.invoiceId} is already on records.`})
        }

        const newTransaction = new inflowsTransaction({ dateTime: getCurrentDateTime(), auditor: userName, auditorId: data.userId, invoiceId: data.invoiceId, customerName: data.customerName, totalAmount: data.totalAmount }) 
        await newTransaction.save()

        await invoiceRecords.findByIdAndUpdate(invoiceId, {Status: "Paid"})

        socket.emit('receive_audit_authUser', {msg: `Transaction for Invoice ID: ${data.invoiceId} is now on records.`})

        //SEND DATA TO ALL CONNECTED CLIENSTS
        const result = await inflowsTransaction.find({}).sort({ createdAt: -1})
        io.emit('receive_audit_history', result)

        const toReviewRecords = await getToAuditRecords()
        io.emit('receive_paid_records', toReviewRecords)

    }

    const getAuditRecords = async (data) => {
        const result = await inflowsTransaction.find({}).sort({ createdAt: -1})
        socket.emit('receive_audit_history', result)
    }

    socket.on('auth_user', authUser)
    socket.on('get_audit_history', getAuditRecords)
}