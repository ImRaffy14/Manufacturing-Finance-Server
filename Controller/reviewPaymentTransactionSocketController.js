const { getPaidRecords } = require('../Model/invoiceAggregation')

module.exports = (socket, io) => {

    const getPaidRecord = async (data) => {
        const result = await getPaidRecords()
        socket.emit("receive_paid_records", result)
    }

    socket.on("get_paid_records", getPaidRecord)
}