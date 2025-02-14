const { oRunAnomalyDetection } = require('../Controller/Anomaly-Detection/machine-learning/outflowAutoencoder')
const { iRunAnomalyDetection } = require('../Controller/Anomaly-Detection/machine-learning/inflowAutoencoder')
const { purchaseOrderDuplication, inflowDuplication, outflowDuplication, budgetRequestDuplication, suspiciousLogin } = require('../Controller/Anomaly-Detection/rule-based/detectDuplication')
const failedAttemptRecords = require('../Model/failedAttemptsModel')

module.exports = (socket, io ) => {
    
    // GET POSSIBLE OUTFLOW ANOMALY
    const handleGetOfAnomaly = async (data) => {
        try{
            const anomalies = await oRunAnomalyDetection()
            if(anomalies) socket.emit('receive_possible_outflow_anomaly', anomalies)
            
        }
        catch(error){
            console.error(`Error: ${error.message}`)
        }
    }

    // GET POSSIBLE INFLOW ANOMALY
    const handleGetIfAnomaly = async (data) => {
        try{
            const anomalies = await iRunAnomalyDetection()
            if(anomalies) socket.emit('receive_possible_inflow_anomaly', anomalies)
        }
        catch(error){
            console.error(`Error: ${error.message}`)
        }
    }

    // GET BUDGET REQUEST DUPLICATION
    const getBudgetReqDuplication = async (data) => {
        try{
            const result = await budgetRequestDuplication()
            socket.emit('receive_budget_req_duplication', result)
        }
        catch(error){
            consotle.error(`Budget req duplication error: ${error.message}`)
        }
    }

    // GET PURCHASE ORDER DUPLICATION
    const getPurchaseOrderDuplication = async (data) => {
        try{   
            const result = await purchaseOrderDuplication()
            socket.emit('receive_po_duplicaiton', result)
        }
        catch(error){
            console.error(`Purchase order duplication error: ${error.message}`)
        }
    }

    // GET INFLOW TRANSACTION DUPLICATION
    const getInflowTransactionDuplication = async (data) => {
        try{
            const result = await inflowDuplication()
            socket.emit('receive_inflow_duplication', result)
        }
        catch(error){
            console.error(`Inflowflow transaction duplication error: ${error.message}`)
        }
    }

    // GET OUTFLOW TRANSACTION DUPLICATION
    const getOutflowTransactionDuplication = async (data) => {
        try{
            const result = await outflowDuplication()
            socket.emit('receive_outflow_duplication', result)
        }
        catch(error){
            console.error(`Outflow transaction duplication error: ${error.message}`)
        }
    }

    // GET SUSPICIOUS LOGIN
    const getSuspiciousLogin = async (data) => {
        try{
            const result = await suspiciousLogin()
            socket.emit('receive_suspicious_login', result)
        }
        catch(error){
            console.error(`Suspicious login error: ${error.message}`)
        }
    }


    // GET FAILED ATTEMPT LOGIN
    const getFailedAttemptLogin = async (data) => {
        try{
            const result = await failedAttemptRecords.find({})
            socket.emit('receive_failed_attempt', result)
        }
        catch(error){
            console.error(`Failed attempt login error: ${error.message}`)
        }
    }

    socket.on('get_failed_attempt', getFailedAttemptLogin)
    socket.on('get_suspicious_login', getSuspiciousLogin)
    socket.on('get_outflow_duplication', getOutflowTransactionDuplication)
    socket.on('get_inflow_duplication', getInflowTransactionDuplication)
    socket.on('get_po_duplication', getPurchaseOrderDuplication)
    socket.on('get_budget_req_duplication', getBudgetReqDuplication)
    socket.on('get_possible_inflow_anomaly', handleGetIfAnomaly)
    socket.on('get_possible_outflow_anomaly', handleGetOfAnomaly)
}