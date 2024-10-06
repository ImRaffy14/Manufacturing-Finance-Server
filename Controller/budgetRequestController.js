require('dotenv').config()

const budgetRequestData = require("../Model/budgetRequestModel")
const { pendingRequests, processedRequestBudget } = require("../Model/budgetRequestAggregation")
const auditTrails = require('../Model/auditTrailsModel')
const { encryptData } = require("../middleware/encryption")

//GET ALL BUDGET REQUEST
const getPendingBudgetRequest = async (req, res) => {
    const requestData = await pendingRequests()
    const result = encryptData(requestData, process.env.ENCRYPT_KEY)
    res.status(200).json({result})
}

const getProcessedBudgetRequest = async (req, res) => {
    const requestData = await processedRequestBudget()
    const result = encryptData(requestData, process.env.ENCRYPT_KEY)
    res.status(200).json({result})
}


// POST BUDGET REQUEST FROM DIFFERENT SUBSYSTEM
const addBudgetRequest = async (req, res) => {
    const {_id, department, status, totalBudget, category, reason, documents } = req.body

    try{
        const newRequest = new budgetRequestData ({requestId: _id, department, typeOfRequest: 'Budget', category, reason: reason, totalRequest: totalBudget, documents, status, comment: '' })
        const saveRequest = await newRequest.save()

        if(saveRequest){
            res.status(200).json({msg: 'Your Request is on pending'})
            const requestData = await pendingRequests()
            req.io.emit('receive_budget_request_pending', requestData)

            req.io.emit('receive_payable_length', requestData.pendingBudgetRequestsCount.totalCount)
        }
    }
    catch (err){
        res.status(401).json({err: err.message})
    }
}

// UPDATE BUDGET REQUESTS
const updateBudgetRequests = async (req, res) => {
    const { _id, requestId, department, typeOfRequest, category, reason, totalRequest, documents, status, comment } = req.body

    try{

        const updatedRequest = await budgetRequestData.findByIdAndUpdate(
            _id, // Find document by _id
            {
                requestId,
                department,
                typeOfRequest,
                category,
                reason,
                totalRequest,
                documents,
                status,
                comment
            },
            { new: true } 
        )

        if(!updatedRequest){
            return res.status(404).json({msg: "Budget request not found"})
        }

        res.status(200).json({msg: `Budget Request from ${requestId} is now on process`})
        const requestDataPending = await pendingRequests()
        const requestDataprocessed = await processedRequestBudget()
        req.io.emit('receive_budget_request_pending', requestDataPending)
        req.io.emit('receive_budget_request_processed', requestDataprocessed)

        const trailsData = await auditTrails.find({}).sort({createdAt : -1})
        req.io.emit("receive_audit_trails", trailsData)

        req.io.emit('receive_payable_length', requestDataPending.pendingBudgetRequestsCount.totalCount)
  
    }
    catch(error){
        res.status(500).json({error: error.message})
    }
}

module.exports = {
    getPendingBudgetRequest,
    getProcessedBudgetRequest,
    addBudgetRequest,
    updateBudgetRequests,
}