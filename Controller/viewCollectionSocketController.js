const { totalCompanyCash } = require('../Model/totalCashAggregation')
const { aggregateTransactionsCurrentMonth } = require('../Model/collectionAnalyticsAggregation')
const monthlyCollection = require('../Model/monthlyCollectionModel')

module.exports = (socket, io) => {

    //GET TOTAL COMPANY CASH
    const getTotalCompanyCash = async (data) => {
        const result = await totalCompanyCash()
        socket.emit("receive_total_cash", result)
    }

    //GET MONTHY AND WEEKLY COLLECTION ANALYTICS
    const getCollectionAnalytics = async (data) => {
        const result = await aggregateTransactionsCurrentMonth()
        socket.emit("receive_collection_analytics", result)
    }

    //GET MONTHLY RECORDS
    const getMonthlyRecords = async (data) => {
        const result = await monthlyCollection.find({}).sort({ createdAt: -1})
        socket.emit("receive_collection_records", result)
    }

    //GET COLLECTION OF THE SPECIFIC MONTH
    const getMonthCollection = async (data) => {
        const result = await monthlyCollection.findById(data)
        socket.emit("receive_month_collection", result)
    } 

    socket.on("get_total_cash", getTotalCompanyCash)
    socket.on("get_collection_analytics", getCollectionAnalytics)
    socket.on("get_monthly_records", getMonthlyRecords)
    socket.on("get_month_collection", getMonthCollection)
}