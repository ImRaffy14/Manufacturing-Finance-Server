require('dotenv').config()

const budgetRequestData = require("../Model/budgetRequestModel")
const { pendingRequests, processedRequestBudget } = require("../Model/budgetRequestAggregation")
const auditTrails = require('../Model/auditTrailsModel')
const { encryptData } = require("../middleware/encryption")
const cloudinary = require('../utils/cloudinaryConfig')
const fs = require("fs");
const axios = require("axios")

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
    const { approvalId, department, status, totalBudget, category, reason, documents } = req.body

    try{
        const newRequest = new budgetRequestData ({requestId: approvalId, department, typeOfRequest: 'Budget', category, reason: reason, totalRequest: totalBudget, documents, status, comment: '' })
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

// POST BUDGET REQUEST FROM FINANCE CLIENT
const addBudgetRequestFinance = async(req, res) => {
    const { typeOfRequest, totalRequest, category, reason  } = req.body
    
    try{

        let documentUrl = "";
        if (req.file) {
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "documents",
            resource_type: "raw",
            public_id: req.file.originalname
          });
          documentUrl = result.secure_url;
          fs.unlinkSync(req.file.path);
        }

        const newRequest = new budgetRequestData ({requestId: "0000", department: "Finance", typeOfRequest, category, reason, totalRequest, documents: documentUrl, status: "Pending", comment: '' })
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
        console.log(err.message)
        fs.unlinkSync(req.file.path);
    }
}

// UPDATE BUDGET REQUESTS
const updateBudgetRequests = async (req, res) => {
    const { _id, requestId, department, typeOfRequest, category, reason, totalRequest, documents, status, comment } = req.body

    try{
        
        //UPDATES ON FINANCE SERVER
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

        //UPDATES ON OTHER SYSTEM
        const updateOsData = {
            _id: requestId,
            status: status,
            reason: reason,
            comment: comment,
            totalBudget: totalRequest,
            category: category,
            documents: documents,
            department: department,
        }

        if(requestId === "0000"){
            
            try{
                const resultOs = await axios.post('https://manufacturing-logistic1-client-api.onrender.com/api/financeApproval/approved', updateOsData)
                if(resultOs){
                res.status(201).json({msg: `Budget Request from ${requestId} is now on process`})
            }
            }
            catch(error){
                res.status(500).json({msg: error.message})
            }
            
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
    addBudgetRequestFinance,
    updateBudgetRequests,
}