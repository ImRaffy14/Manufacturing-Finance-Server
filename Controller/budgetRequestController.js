require('dotenv').config()

const budgetRequestData = require("../Model/budgetRequestModel")
const { pendingRequests, processedRequestBudget } = require("../Model/budgetRequestAggregation")
const auditTrails = require('../Model/auditTrailsModel')
const { encryptData } = require("../middleware/encryption")
const cloudinary = require('../utils/cloudinaryConfig')
const fs = require("fs");
const axios = require("axios")
const jwt = require('jsonwebtoken')
const { totalLength, budgetRequestDuplication } = require('../Controller/Anomaly-Detection/rule-based/detectDuplication')


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
            const result = await budgetRequestDuplication()
            req.io.emit('receive_budget_req_duplication', result)
            const totalAnomalies = await totalLength()
            req.io.emit('receive_total_anomalies', totalAnomalies)
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

        const newRequest = new budgetRequestData ({requestId: "N/A", department: "Finance", typeOfRequest, category, reason, totalRequest, documents: documentUrl, status: "On process", comment: '' })
        const saveRequest = await newRequest.save()

        if(saveRequest){
            const requestData = await pendingRequests()
            req.io.emit('receive_budget_request_pending', requestData)
            req.io.emit('receive_budget_request_length', requestData.onProcessRequestBudgetCount)
            req.io.emit('receive_payable_length', requestData.pendingBudgetRequestsCount.totalCount)
            const result = await budgetRequestDuplication()
            req.io.emit('receive_budget_req_duplication', result)
            const totalAnomalies = await totalLength()
            req.io.emit('receive_total_anomalies', totalAnomalies)
            res.status(200).json({msg: 'Your Request is on process'})
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

        // TOKEN GENERATOR FOR GATEWAY
        const generateServiceToken = () => {
            const payload = { service: 'Finance' };
            return jwt.sign(payload, process.env.GATEWAY_JWT_SECRET, { expiresIn: '1h' });
        };

        //UPDATES ON OTHER SYSTEM
        const updateOsData = {
            approvalId: requestId,
            status: status,
            reason: reason,
            comment: comment,
            totalBudget: totalRequest,
            category: category,
            documents: documents,
            department: department,
        }

        if(updateOsData.department === "Logistic1"){

            try {
                const token = generateServiceToken();
                const response = await axios.post(`${process.env.API_GATEWAY_URL}/logistic1/update-budget-req-status`, updateOsData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log('Response from Logistic1:', response.data);
            } catch (error) {
                if(error.response){
                    console.log(error.response.data)
                }
                console.error('Something went wrong:', error.response?.data || error.message);
                return res.status(400).json({msg: 'Something went wrong'})
            }
        }
        else if(updateOsData.department === "HR3"){

            try {
                const token = generateServiceToken();
                const response = await axios.post(`${process.env.API_GATEWAY_URL}/hr3/update-status-purchase-order`, updateOsData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log('Response from H3:', response.data);
            } catch (error) {
                console.error('Something went wrong:', error.response?.data || error.message);
                return res.status(400).json({msg: 'Something went wrong'})
            }
        }
        else if(updateOsData.department === "HR4"){
            try {
                const token = generateServiceToken();
                const response = await axios.post(`${process.env.API_GATEWAY_URL}/hr4/api/budget-requests/updateStatusFinance`, updateOsData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log('Response from H4:', response.data);
            } catch (error) {
                console.error('Something went wrong:', error.response?.data || error.message);
                return res.status(400).json({msg: 'Something went wrong'})
            }
        }


        //RESPONSE ON FINANCE CLIENT
        res.status(200).json({msg: `Budget Request from ${department} is now on process`})
        const requestDataPending = await pendingRequests()
        const requestDataprocessed = await processedRequestBudget()
        req.io.emit('receive_budget_request_pending', requestDataPending)
        req.io.emit('receive_budget_request_processed', requestDataprocessed)
        req.io.emit('receive_budget_request_length', requestDataPending.onProcessRequestBudgetCount)

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