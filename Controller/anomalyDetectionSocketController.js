const { oRunAnomalyDetection } = require('../Controller/Anomaly-Detection/machine-learning/outflowAutoencoder')

module.exports = (socket, io ) => {
    
    const handleGetOfAnomaly = async (data) => {
        console.log(data)
        const anomalies = await oRunAnomalyDetection()
        socket.emit('receive_possible_outflow_anomaly', anomalies)
        
    }


    socket.on('get_possible_outflow_anomaly', handleGetOfAnomaly)
}