const { pendingRequests } = require('../Model/budgetRequestAggregation')

module.exports = (socket, io) =>{

    const payableLength = async (data) =>{
        const result = await pendingRequests()
        socket.emit('receive_payable_length', result.pendingBudgetRequestsCount.totalCount)
    }



    socket.on('get_payable_length', payableLength)
}