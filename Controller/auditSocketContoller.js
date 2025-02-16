const inflowsTransaction = require('../Model/inflowsTransactionModel')
const accounts = require('../Model/accountsModel')
const invoiceRecords = require('../Model/invoiceRecordsModel')
const { getToAuditRecords } = require('../Model/invoiceAggregation')
const { totalCompanyCash } = require('../Model/totalCashAggregation')
const { aggregateTransactionsCurrentMonth } = require('../Model/collectionAnalyticsAggregation')
const { inflowDuplication } = require('../Controller/Anomaly-Detection/rule-based/detectDuplication')
const { verifyPassword } = require('../middleware/passwordVerification')


const bcrypt = require('bcryptjs')

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

    const authUser = async (data) => {

        const userName = data.userName
        const password = data.password
        const invoiceId = data.invoiceId

        const user = await verifyPassword(userName, password)
        if(!user){
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

        const totalCash = await totalCompanyCash()
        io.emit("receive_total_cash", totalCash)

        const analytics = await aggregateTransactionsCurrentMonth()
        io.emit("receive_collection_analytics", analytics)

        const resultDuplication = await inflowDuplication()
        io.emit('receive_inflow_duplication', resultDuplication)

    }

    const getAuditRecords = async (data) => {
        const result = await inflowsTransaction.find({}).sort({ createdAt: -1})
        socket.emit('receive_audit_history', result)
    }

    socket.on('auth_user', authUser)
    socket.on('get_audit_history', getAuditRecords)
}