const { oRunAnomalyDetection } = require('../Controller/Anomaly-Detection/machine-learning/outflowAutoencoder')
const { iRunAnomalyDetection } = require('../Controller/Anomaly-Detection/machine-learning/inflowAutoencoder')
const { totalLength, purchaseOrderDuplication, inflowDuplication, outflowDuplication, budgetRequestDuplication, suspiciousLogin } = require('../Controller/Anomaly-Detection/rule-based/detectDuplication')
const failedAttemptRecords = require('../Model/failedAttemptsModel')
const resolvedAnomalies = require('../Model/processAnomaliesModel')
const blacklistedIp = require('../Model/blacklistedIpModel')
const axios = require('axios')
const { verifyPassword } = require('../middleware/passwordVerification')
const inflowTransactionRecords = require('../Model/inflowsTransactionModel')
const outflowTransactionRecords = require('../Model/outflowsTransactionModel')
const budgetRequestRecords = require('../Model/budgetRequestModel')
const purchaseOrderRecords = require('../Model/invoiceRecordsModel')


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

    // INVESTIGATE ANOMALY
    const handleInvestigateAnomaly = async (data) => {
        try{

            const user = await verifyPassword(data.userName, data.password)
            if(!user){
                return socket.emit('error_verification', {msg: 'Invalid Credentials'})
            }

            const isSaved = await resolvedAnomalies.find({ dataId: data.rowData.dataId, anomalyFrom: data.rowData.anomalyFrom})
            if(isSaved.length > 0){
                if(data.rowData.anomalyFrom === "Outflow Transactions Data"  && data.rowData.anomalyType === "Data Discrepancy"){
                    return socket.emit('new_investigate_error', { msg: "This Data is already on investigation", modalType: "outflow anomaly"})
                }
                else if(data.rowData.anomalyFrom === "Inflow Transactions Data"  && data.rowData.anomalyType === "Data Discrepancy"){
                    return socket.emit('new_investigate_error', { msg: "This Data is already on investigation", modalType: "inflow anomaly"})
                }
                else if(data.rowData.anomalyFrom === "Inflow Transactions Data"  && data.rowData.anomalyType === "Data Duplication"){
                    return socket.emit('new_investigate_error', { msg: "This Data is already on investigation", modalType: "inflow duplication"})
                }
                else if(data.rowData.anomalyFrom === "Outflow Transactions Data"  && data.rowData.anomalyType === "Data Duplication"){
                    return socket.emit('new_investigate_error', { msg: "This Data is already on investigation", modalType: "outflow duplication"})
                }
                else if(data.rowData.anomalyFrom === "Budget Request Data"){
                    return socket.emit('new_investigate_error', { msg: "This Data is already on investigation", modalType: "budget req duplication"})
                }
                else if(data.rowData.anomalyFrom === "Purchase Order Data"){
                    return socket.emit('new_investigate_error', { msg: "This Data is already on investigation", modalType: "purchase order duplication"})
                }
            }

            const newRA = new resolvedAnomalies({
                anomalyType: data.rowData.anomalyType,
                dataId: data.rowData.dataId,
                anomalyFrom: data.rowData.anomalyFrom,
                description: data.rowData.description,
                investigateBy: data.rowData.investigateBy,
                investigateDate: data.rowData.investigateDate,
                status: data.rowData.status
            })

            const savedRA = await newRA.save()
            if(savedRA.anomalyFrom === "Outflow Transactions Data"  && savedRA.anomalyType === "Data Discrepancy"){
                socket.emit('receive_new_investigate', { modalType: "outflow anomaly"})
            }
            else if(savedRA.anomalyFrom === "Inflow Transactions Data"  && savedRA.anomalyType === "Data Discrepancy"){
                socket.emit('receive_new_investigate', { modalType: "inflow anomaly"})
            }
            else if(savedRA.anomalyFrom === "Outflow Transactions Data"  && savedRA.anomalyType === "Data Duplication"){
                socket.emit('receive_new_investigate', { modalType: "outflow duplication"})
            }
            else if(savedRA.anomalyFrom === "Inflow Transactions Data"  && savedRA.anomalyType === "Data Duplication"){
                socket.emit('receive_new_investigate', { modalType: "inflow duplication"})
            }
            else if(savedRA.anomalyFrom === "Budget Request Data"){
                socket.emit('receive_new_investigate', { modalType: "budget req duplication"})
            }
            else if(savedRA.anomalyFrom === "Purchase Order Data"){
                socket.emit('receive_new_investigate', { modalType: "purchase order duplication"})
            }
            else{
                socket.emit('receive_new_investigate', { modalType: "Data not found"})
            }

            
            const result = await resolvedAnomalies.find({}).sort({ createdAt: 1 })
            io.emit('receive_resolved_anomalies', result)
            const totalAnomalies = await totalLength()
            io.emit('receive_total_anomalies', totalAnomalies)
        }
        catch(error){
            console.error(`Resolve anomaly error: ${error.message}`)
        }
    }

    // GET RESOLVED ANOMALIES
    const getResolvedAnomalies = async (data) => {
        const result = await resolvedAnomalies.find({}).sort({ createdAt: 1})
        socket.emit('receive_resolved_anomalies', result)
    }

    // RESOLVE ANOMALY REVERT
    const revertAnomaly = async (data) => {
        try{

            const user = await verifyPassword(data.userName, data.password)
            if(!user){
                return socket.emit('error_verification', {msg: 'Invalid Credentials'})
            }

            const result = await resolvedAnomalies.findByIdAndUpdate(data.rowData._id, {
                resolvedBy: data.rowData.resolvedBy,
                resolvedDate: data.rowData.resolvedDate,
                resolutionAction: data.rowData.resolutionAction,
                status: data.rowData.status
            })

            socket.emit('response_resolved', { msg: `${result._id} is now resolved`, modalType: 'revert'})
            const resolvedAnomolies = await resolvedAnomalies.find({}).sort({ createdAt: 1 })
            io.emit('receive_resolved_anomalies', resolvedAnomolies)
            const totalAnomalies = await totalLength()
            io.emit('receive_total_anomalies', totalAnomalies)
        }
        catch(error){
            console.error(`Resolved revert anomaly error: ${error.message}`)
        }
    }

    // RESOLVE ANOMALY REMOVE
    const removeAnomaly = async (data) => {
        try{

            const user = await verifyPassword(data.userName, data.password)
            if(!user){
                return socket.emit('error_verification', {msg: 'Invalid Credentials'})
            }

            if(data.rowData.anomalyFrom === "Inflow Transactions Data" && data.rowData.anomalyType === "Data Discrepancy"){
                const result = await inflowTransactionRecords.findOneAndDelete({ _id: data.rowData.dataId})
                if(!result){
                    return socket.emit('response_resolved', { errMsg: 'Data not found'})
                }
                await purchaseOrderRecords.findOneAndDelete({ _id: result.invoiceId})
            }
            else if(data.rowData.anomalyFrom === "Inflow Transactions Data" && data.rowData.anomalyType === "Data Duplication"){
                const result = await inflowTransactionRecords.deleteMany({ invoiceId: data.rowData.dataId})
                if(!result){
                    return socket.emit('response_resolved', { errMsg: 'Data not found'})
                }
                const inflowDupli = await inflowDuplication()
                io.emit('receive_inflow_duplication', inflowDupli)
            }
            else if(data.rowData.anomalyFrom === "Outflow Transactions Data" && data.rowData.anomalyType === "Data Duplication"){
                const result =  await outflowTransactionRecords.findOneAndDelete({ payableId: data.rowData.dataId})
                if(!result){
                    return socket.emit('response_resolved', { errMsg: 'Data not found'})
                }
                const outflowDupli = await outflowDuplication()
                io.emit('receive_outflow_duplication', outflowDupli)
            }
            else if(data.rowData.anomalyFrom === "Outflow Transactions Data"){
                const result =  await outflowTransactionRecords.findOneAndDelete({ _id: data.rowData.dataId})
                if(!result){
                    return socket.emit('response_resolved', { errMsg: 'Data not found'})
                }
                await budgetRequestRecords.findOneAndDelete({ _id: result.payableId})
            }
            else if(data.rowData.anomalyFrom === "Budget Request Data"){
                const result =  await budgetRequestRecords.deleteMany({ requestId: data.rowData.dataId})
                if(!result){
                    return socket.emit('response_resolved', { errMsg: 'Data not found'})
                }
                const budgetRequestDupli = await budgetRequestDuplication()
                io.emit('receive_budget_req_duplication', budgetRequestDupli)
            }
            else if(data.rowData.anomalyFrom === "Purchase Order Data"){
                const result = await purchaseOrderRecords.deleteMany({ orderNumber: data.rowData.dataId})
                if(!result){
                    return socket.emit('response_resolved', { errMsg: 'Data not found'})
                }
                const purchaseOrderDuplic = await purchaseOrderDuplication()
                io.emit('receive_po_duplicaiton', purchaseOrderDuplic)
            }
            else{
               return socket.emit('response_resolved', { errMsg: 'Data not found.'})
            }

            const result = await resolvedAnomalies.findByIdAndUpdate(data.rowData._id, {
                resolvedBy: data.rowData.resolvedBy,
                resolvedDate: data.rowData.resolvedDate,
                resolutionAction: data.rowData.resolutionAction,
                status: data.rowData.status
            })


            socket.emit('response_resolved', { msg: `${result._id} is now resolved and the affected entities are fixed`, modalType: 'remove'})
            const resolvedAnomolies = await resolvedAnomalies.find({}).sort({ createdAt: 1 })
            io.emit('receive_resolved_anomalies', resolvedAnomolies)
            const totalAnomalies = await totalLength()
            io.emit('receive_total_anomalies', totalAnomalies)
        }
        catch(error){
            console.error(`Resolved remove anomaly error: ${error.message}`)
        }
    }

    // BAN CLIENT IP ADDRESS FROM FAILED ATTEMTPS LOGS
    const handleBlockIp = async (data) => {
        try{
            const user = await verifyPassword(data.userName, data.password)
            if(!user){
                return socket.emit('error_verification', {msg: 'Invalid Credentials'})
            }
      
            await blacklistedIp.create({
              userId: data.row.userId,
              username: data.row.username,
              ipAddress: data.row.ipAddress,
              banTime: Date.now(),
              banDuration: 0,
              banned: true,
          }) 
            await failedAttemptRecords.findOneAndDelete({ _id: data.row._id})
            const FAL = await failedAttemptRecords.find({})
            io.emit('receive_failed_attempt', FAL)
            socket.emit('block_ip_FAL_success', {msg: `Client is now blacklisted`})
            const blacklistRecords = await blacklistedIp.find({})
            io.emit('receive_blacklisted', blacklistRecords)
            

          }
          catch(error){
            console.error(`block IP address Manual From FAL Error: ${error.message}`)
            socket.emit('block_ip_FAL_error')
          }
    }

    // GET TOTAL ANOMALY COUNT
    const getTotalAnomalies = async (data) => {
        const totalAnomalies = await totalLength()
        socket.emit('receive_total_anomalies', totalAnomalies)
    }

    socket.on('get_total_anomalies', getTotalAnomalies)
    socket.on('remove_resolved_anomaly', removeAnomaly)
    socket.on('revert_resolved_anomaly', revertAnomaly)
    socket.on('block_ip_FAL', handleBlockIp)
    socket.on('get_resolved_anomalies', getResolvedAnomalies)
    socket.on('investigate_anomaly', handleInvestigateAnomaly)
    socket.on('get_failed_attempt', getFailedAttemptLogin)
    socket.on('get_suspicious_login', getSuspiciousLogin)
    socket.on('get_outflow_duplication', getOutflowTransactionDuplication)
    socket.on('get_inflow_duplication', getInflowTransactionDuplication)
    socket.on('get_po_duplication', getPurchaseOrderDuplication)
    socket.on('get_budget_req_duplication', getBudgetReqDuplication)
    socket.on('get_possible_inflow_anomaly', handleGetIfAnomaly)
    socket.on('get_possible_outflow_anomaly', handleGetOfAnomaly)
}