const { oRunAnomalyDetection } = require('../Controller/Anomaly-Detection/machine-learning/outflowAutoencoder')
const { iRunAnomalyDetection } = require('../Controller/Anomaly-Detection/machine-learning/inflowAutoencoder')

module.exports = (socket, io ) => {
    
    const handleGetOfAnomaly = async (data) => {
        try{
            const anomalies = await oRunAnomalyDetection()
            if(anomalies) socket.emit('receive_possible_outflow_anomaly', anomalies)
            
        }
        catch(error){
            console.error(`Error: ${error.message}`)
        }
    }

    const handleGetIfAnomaly = async (data) => {
        try{
            const anomalies = await iRunAnomalyDetection()
            if(anomalies) socket.emit('receive_possible_inflow_anomaly', anomalies)
        }
        catch(error){
            console.error(`Error: ${error.message}`)
        }
    }

    socket.on('get_possible_inflow_anomaly', handleGetIfAnomaly)
    socket.on('get_possible_outflow_anomaly', handleGetOfAnomaly)
}