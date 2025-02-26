const { pendingRequests } = require('../Model/budgetRequestAggregation')
const orderInformationRecords = require('../Model/orderInformationModel')

module.exports = (socket, io) =>{

    const payableLength = async (data) =>{
        const result = await pendingRequests()
        socket.emit('receive_payable_length', result.pendingBudgetRequestsCount.totalCount)
    }

    const budgetRequestLength = async (data) =>{
        const result = await pendingRequests()
        socket.emit('receive_budget_request_length', result.onProcessRequestBudgetCount)
    }

    const getOrderInfoLength = async (data) => {
        const orders = await orderInformationRecords.find({})
        const result = orders.length
        socket.emit('receive_orders_length', result)
    }

    socket.on('get_orders_length', getOrderInfoLength)
    socket.on('get_payable_length', payableLength)
    socket.on('get_budget_request_length', budgetRequestLength)
}