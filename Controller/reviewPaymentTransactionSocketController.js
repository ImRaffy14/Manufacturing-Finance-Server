const { getToAuditRecords } = require('../Model/invoiceAggregation')

module.exports = (socket, io) => {

    const getToAudit = async (data) => {
        const result = await getToAuditRecords()
        socket.emit("receive_paid_records", result)
    }

    socket.on("get_paid_records", getToAudit)
}