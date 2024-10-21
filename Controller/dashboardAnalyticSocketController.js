const monthlyCollection = require('../Model/monthlyCollectionModel')

module.exports = (socket, io) => {

    const getDashboardAnalytics = async (data) => {
        const result = await monthlyCollection.find({})
        socket.emit("receive_dashboard_analytics", result)
    }

    socket.on("get_dashboard_analytics", getDashboardAnalytics)
}