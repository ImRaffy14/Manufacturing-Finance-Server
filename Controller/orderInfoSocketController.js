const orderInformationRecords = require("../Model/orderInformationModel")

module.exports = (socket, io) => {

    // GET ORDERS
    const getOrders = async (data) => {
        const result = await orderInformationRecords.find({}).sort({ createdAt: -1})
        socket.emit("receive_orders", result)
    }

    socket.on("get_orders", getOrders)
}