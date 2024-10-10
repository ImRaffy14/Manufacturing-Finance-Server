const { pendingRequests } = require('../Model/budgetRequestAggregation')

module.exports = (socket, io) =>{

    const payableLength = async (data) =>{
        const result = await pendingRequests()
        socket.emit('receive_payable_length', result.pendingBudgetRequestsCount.totalCount)
    }

    const budgetRequestLength = async (data) =>{
        const result = await pendingRequests()
        socket.emit('receive_budget_request_length', result.onProcessRequestBudgetCount)
    }


    socket.on('get_payable_length', payableLength)
    socket.on('get_budget_request_length', budgetRequestLength)
}