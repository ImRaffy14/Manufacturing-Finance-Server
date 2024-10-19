const { totalCompanyCash } = require('../Model/totalCashAggregation')
const { aggregateTransactionsCurrentMonth, transactionRecordsCurrentMonth } = require('../Model/collectionAnalyticsAggregation')

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

    const getMonthlyRecords = async (data) => {
        const result = await transactionRecordsCurrentMonth()
        socket.emit("receive_monthly_collection_records", result)
    }

    socket.on("get_total_cash", getTotalCompanyCash)
    socket.on("get_collection_analytics", getCollectionAnalytics)
    socket.on("get_monthly_collection_records", getMonthlyRecords)
}