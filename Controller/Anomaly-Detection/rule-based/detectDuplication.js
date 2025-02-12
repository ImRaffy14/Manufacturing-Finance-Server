const invoiceRecords = require('../../../Model/invoiceRecordsModel')
const inflowTransactionRecord = require('../../../Model/inflowsTransactionModel')
const outflowTransactionRecord = require('../../../Model/outflowsTransactionModel')
const budgetRequestRecords = require('../../../Model/budgetRequestModel')
const activeStaffRecords = require('../../../Model/activeStaffModel')


// PURCHASE ORDER
const purchaseOrderDuplication = async () => {
    const duplicates = await invoiceRecords.aggregate([
        {
            $group: {
                _id: { orderNumber: "$orderNumber", customerName: "$customerName", totalAmount: "$totalAmount" },
                count: { $sum: 1 },
                poId: { $push: "$_id" }
            }
        },
        {
            $match: { count: { $gt: 1 } }
        }
    ])
   
    return duplicates
}

//INFLOW TRANSACTION
const inflowDuplication = async () => {
    const duplicates = await inflowTransactionRecord.aggregate([
        {
            $group: {
                _id: { auditorId: "$auditorId", auditor: "$auditor", invoiceId: "$invoiceId", totalAmount: "$totalAmount" },
                count: { $sum: 1 },
                inflowId: { $push: "$_id" }
            }
        },
        {
            $match: { count: { $gt: 1 } }
        }
    ])
   
    return duplicates
}

//OUTFLOW TRANSACTION
const outflowDuplication = async () => {
    const duplicates = await outflowTransactionRecord.aggregate([
        {
            $group: {
                _id: { approverId: "$approverId", approver: "$approver", payableId: "$payableId", totalAmount: "$totalAmount" },
                count: { $sum: 1 },
                outflowId: { $push: "$_id" }
            }
        },
        {
            $match: { count: { $gt: 1 } }
        }
    ])
   
    return duplicates
}

//BUDGET REQUEST
const budgetRequestDuplication = async () => {
    const duplicates = await budgetRequestRecords.aggregate([
        {
            $group: {
                _id: { requestId: "$requestId", department: "$department", category: "$category", totalRequest: "$totalRequest"},
                count: { $sum: 1 },
                budgetReqId: { $push: "$_id"}
            }
        },
        {
            $match: { count: { $gt: 1 } }
        }
    ])

    return duplicates
}

//SUSPICIOUS LOGIN
const suspiciousLogin = async () => {
    const result = await activeStaffRecords.aggregate([
        {
            $group: {
                _id: { userId: "$userId", username: "$username", role: "$role" },
                count: { $sum: 1 },
                ipAddress: { $push: "$ipAddress" }
            }  
        },
        {
            $match: { count: { $gt: 1 } }
        }
    ])

    return result;
}

module.exports = {
    purchaseOrderDuplication,
    inflowDuplication,
    outflowDuplication,
    budgetRequestDuplication,
    suspiciousLogin
}
