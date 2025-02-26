const financialReportModel = require('../Model/financialReportsModel')

module.exports = (socket, io) => {

    const getFinancialReport = async (data) => {
        const result = await financialReportModel.find({}).sort({ createdAt: -1 })
        socket.emit('receive_financial_report', result)
    }

    const getSpecificFinancialReport = async(data) => {
        const result = await financialReportModel.findById(data)
        socket.emit('receive_specific_financial_report', result)
    }
    

    socket.on('get_financial_report', getFinancialReport)
    socket.on('get_specific_financial_report', getSpecificFinancialReport)
}